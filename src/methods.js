const ExcelJS = require("exceljs");
const { constants, existsSync, mkdirSync } = require("fs");
const { copyFile, rename } = require("fs/promises");
const path = require("path");
const { myBase64Image } = require("./label");
const { logger } = require("./logger");

const addLabelAndSave = async (filename, newFilename) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filename);
        const fileName = path.basename(newFilename);
        const resourceId = path.dirname(newFilename).split(path.sep).slice(-1);

        const imageId = workbook.addImage({
            base64: myBase64Image,
            extension: "png",
        });

        const rowLimit = Number(process.env.QS_WTC_ROWS_LIMIT);
        const columnLimit = Number(process.env.QS_TEMP_CONTENT_EXPORT_COLUMNS_LIMIT);
        const overflow = [`Максимальное кол-во строк: ${rowLimit}`, `Максимальное кол-во столбцов: ${columnLimit}`];

        workbook.eachSheet((worksheet, sheetId) => {
            const { rowCount, columnCount } = worksheet;
            logger.info(`${resourceId} | ${fileName} | ROWS_COUNT | ${rowCount}`);
            logger.info(`${resourceId} | ${fileName} | COLUMNS_COUNT | ${columnCount}`);

            if (rowCount > rowLimit) {
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === rowLimit + 1) {
                        row.values = [overflow[0], `Вы пытались выгрузить следующее кол-во строк: ${rowCount}`];
                        row.font = { color: { argb: "FFFF0000" } };
                    } else if (rowNumber > rowLimit + 1) {
                        row.values = [];
                    }
                });
            }

            if (columnCount > columnLimit) {
                const col = worksheet.getColumn(1).values.length - 2;
                const dumb = new Array(col);
                for (let i = columnLimit + 1; i < columnCount + 1; i++ ) {
                    const limitedCol = worksheet.getColumn(i);
                    limitedCol.values = [...dumb];
                }
                const warningCol = worksheet.getColumn(columnLimit + 1)
                warningCol.values = [overflow[1], `Вы пытались выгрузить следующее кол-во столбцов: ${columnCount}`];
                warningCol.font = { color: { argb: "FFFF0000" } };
            }

            worksheet.addImage(imageId, "N2:S3");
        });
        await workbook.xlsx.writeFile(newFilename);
        return true;
    } catch (error) {
        logger.error(`addLabelAndSave`, error, JSON.stringify(error));
    }
};

const getDestination = (file, dest) => {
    const oldLoc = file.split(path.sep);
    return path.join(dest, ...oldLoc.slice(-2));
};

const copyToArch = async (file, dest) => {
    const destination = getDestination(file, dest);
    const dir = path.dirname(destination);

    try {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        await copyFile(file, destination, constants.COPYFILE_EXCL);
        return true;
    } catch (error) {
        if (error.code !== "EBUSY") {
            logger.error(`copyToArch`, error, JSON.stringify(error));
        } else {
            await retry(() => copyFile(file, destination, constants.COPYFILE_EXCL), 600, 1000); // теоретически через 600 секунд (10 минут) Qlik Sense сам удалит файл из папки TempContent
        }
    }
};

const renameFile = async (oldFile, newFile) => {
    try {
        await rename(oldFile, newFile);
    } catch (error) {
        if (error.code !== "EBUSY") {
            logger.error(`renameFile`, error, JSON.stringify(error));
            throw new Error(error);
        } else {
            await retry(() => rename(oldFile, newFile), 600, 1000); // теоретически через 600 секунд (10 минут) Qlik Sense сам удалит файл из папки TempContent
        }
    }
};

const wait = interval => new Promise(resolve => setTimeout(resolve, interval));
async function retry(fn, retriesLeft = 3, interval = 200) {
    try {
        return await fn();
    } catch (error) {
        await wait(interval);
        if (retriesLeft === 0) {
            throw new Error(error);
        }
        // console.log(`waiting ${retriesLeft}...`);
        return await retry(fn, --retriesLeft, interval);
    }
}

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const createErrorWorkbook = async (message, filePath) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Error");
    const row = worksheet.getRow(1);
    row.values = [message];

    await workbook.xlsx.writeFile(filePath);
    logger.info(`${path.basename(filePath)} was saved`);
};

module.exports = {
    addLabelAndSave,
    copyToArch,
    getDestination,
    renameFile,
    formatBytes,
    createErrorWorkbook,
};
