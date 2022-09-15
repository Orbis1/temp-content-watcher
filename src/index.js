require('dotenv').config();
const chokidar = require('chokidar');
const path = require('path');
const { Worker } = require('worker_threads');
const { logger } = require('./logger');
const { copyToArch, formatBytes, createErrorWorkbook } = require('./methods');

const tempContent = process.env.QS_WTC_DIRS;
const dirs = tempContent.split('|');
const tempContentArchive = process.env.QS_WTC_ARCHIVE_DIR;
const timeLimitInSec = process.env.QS_WTC_TIME_LIMIT_SEC;
const rowLimit = Number(process.env.QS_WTC_ROWS_LIMIT);
const colLimit = Number(process.env.QS_TEMP_CONTENT_EXPORT_COLUMNS_LIMIT);
const errorMsg = `Попробуйте уменьшить объём данных. Максимальное кол-во строк: ${rowLimit}. Максимальное кол-во столбцов: ${colLimit} Максимальная продолжительность выгрузки: ${timeLimitInSec} (сек.)`;

const watcher = chokidar.watch(dirs, {
  ignored: /(~\$|_).*\.xlsx|.*\.env|.*\.qvf/, // игнорирует файлы, которые (начинаются на ~$ или _ и заканчиваются на .xlsx) или .env или .qvf
  persistent: true,
  ignoreInitial: true
});

let renamed = [];

watcher
  .on('add', async function (file, stats) {
    const fileName = path.basename(file);
    const resourceId = path.dirname(file).split(path.sep).slice(-1);

    logger.info(`File ${fileName} (${formatBytes(stats.size)}) has been added`);

    if (path.extname(file) === '.xlsx') {
      if (!renamed.includes(fileName)) {
        renamed.push(fileName);

        const worker = new Worker(__dirname + '/worker.js', {
          workerData: {
            file,
            tempContentArchive,
            timeLimit: timeLimitInSec * 1000
          }
        });

        worker.on('message', (msg) => logger.info(`${msg}`));

        worker.on('error', async (err) => {
          logger.error(`${err}`);
          await createErrorWorkbook(err.message + '. ' + errorMsg, file);
          await copyToArch(file, tempContentArchive);
          // if (err.message === "Time out!") await createErrorWorkbook(errorMsg, file);
        });

        worker.on('exit', (code) => {
          code === 0
            ? logger.info(`${resourceId} | ${fileName} | SUCCESS`)
            : logger.warn(`${resourceId} | ${fileName} | FAIL`);
        });
      }
    } else {
      copyToArch(file, tempContentArchive);
    }
    if (renamed.length > 100) renamed = renamed.slice(-50); // чтобы процесс не приростал в памяти
  })
  .on('change', function (file, stats) {
    // logger.info(`File ${file} (${formatBytes(stats.size)}) has been changed`);
  })
  .on('unlink', function (file) {
    // logger.info(`File ${file} has been removed`);
  })
  .on('error', function (error) {
    // logger.error(error);
  });
