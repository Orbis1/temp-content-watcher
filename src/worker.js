const { workerData, parentPort } = require("worker_threads");
const path = require("path");
const { logger } = require("./logger");
const { copyToArch, renameFile, addLabelAndSave } = require("./methods");

async function xlsx_routine({ file, tempContentArchive, timeLimit }) {
    const basename = path.basename(file);
    // parentPort.postMessage(`${basename}'s worker xlsx_routine starts`);
    const tmpName = file.replace(basename, `_${basename}`);
    await renameFile(file, tmpName);

    setTimeout(() => {
        throw new Error("Ошибка экспорта");
    }, timeLimit);

    const labeled = await addLabelAndSave(tmpName, file);
    if (!labeled) throw new Error("Ошибка при грифовании и сохранении");
    const copied = await copyToArch(file, tempContentArchive);
    if (!copied) throw new Error("Ошибка при копировании в архив");
    process.exit(0);
}

xlsx_routine(workerData);
