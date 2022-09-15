import mock from 'mock-fs';
import fs from 'fs';
import { ExportFile } from './ExportFile';

describe('ExportFile', () => {
  let exportFile: any;
  let filePath: string;

  beforeEach(() => {
    const structure = {
      'someFolder': {
        'file.txt': 'test'
      },
    }
    mock(structure);
    filePath = process.cwd() + '/someFolder/file.txt';
    exportFile = new ExportFile(filePath, 1);
  })

  afterAll(() => {
    mock.restore();
  })

  it('should rename file', () => {
    const newName = 'newName';
    const newPath = filePath.replace('file', newName);
    expect(exportFile.rename(newName)).toBeTruthy();
    expect(fs.existsSync(filePath)).toBeFalsy();
    expect(fs.existsSync(newPath)).toBeTruthy();
  })

})