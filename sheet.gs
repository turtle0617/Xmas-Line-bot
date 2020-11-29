function getSheetTable() {
    const sheetURL = SHEET_CONFIG.url;
    const SpreadSheet = SpreadsheetApp.openByUrl(sheetURL);
    const SheetName = SpreadSheet.getSheetByName(SHEET_CONFIG.tableName);
    return SheetName;
}

function getSheetColunmOfRowValue(row, startIndex = 1) {
    const sheet = getSheetTable();
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(`${row}${startIndex}:${row}${lastRow}`);
    const values = range.getValues();
    return values.flat().filter(o => o)
}

function checkUserInSheet(userId) {
    const idList = getSheetColunmOfRowValue('A', 2);
    return idList.some(id => id === userId);
}

function findTextPositionFromSheet(text) {
    const sheet = getSheetTable();
    const startRowSymbolASCII = "A".charCodeAt();
    const values = sheet.getDataRange().getValues();
    let position = [];
    for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
        for (let colIndex = 0; colIndex < values[rowIndex].length; colIndex++) {
            if (values[rowIndex][colIndex] === text) {
                const colSymbol = String.fromCharCode(startRowSymbolASCII + colIndex);
                position = [colSymbol, rowIndex + 1];
                break;
            }
        }

    }
    return position;
}

function appendInToSheet(data) {
    try {
        const startRowSymbolASCII = "A".charCodeAt();
        const sheet = getSheetTable();
        const lastRow = sheet.getLastRow();
        const lastRowSingle = String.fromCharCode(startRowSymbolASCII + data.length - 1);
        const range = sheet.getRange(`A${lastRow + 1}:${lastRowSingle}${lastRow + 1}`);
        range.setValues([data]);
    } catch (error) {
        console.log('appendInTo sheet fail', error)
    }
}

function setInToSheet(range, data) {
    try {
        const sheet = getSheetTable();
        if (Array.isArray(data)) {
            sheet.getRange(range).setValues(data)
        } else {
            sheet.getRange(range).setValue(data)
        }
    } catch (error) {
        console.log('setInToSheet error :>> ', error);
    }
}
