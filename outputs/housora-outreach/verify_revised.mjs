import fs from 'node:fs/promises';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
const p='C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach/Housora_Outreach_Database_Revised.xlsx';
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(p));
console.log((await wb.inspect({kind:'table',range:'Already Contacted!A1:E8',include:'values,formulas',tableMaxRows:8,tableMaxCols:5,maxChars:5000})).ndjson);
const img=await wb.render({sheetName:'Already Contacted',range:'A1:E8',scale:1,format:'png'});await fs.writeFile('C:/Users/LENOVO/Desktop/Housora/outputs/housora-outreach/revised_Already_Contacted.png',new Uint8Array(await img.arrayBuffer()));
