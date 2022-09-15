import * as fs from "fs";
import { ExportFile } from './ExportFile';

const onAdd = (file: string, stats: fs.Stats): void => {
  const exportFile = new ExportFile(file, stats.uid);
  // rename
  // exportFile.rename('ololo');

  console.log({ exportFile, stats });
}

export { onAdd };

/*
Stats {
    dev: 905969667,
    mode: 33216,
    nlink: 1,
    uid: 933589333,
    gid: 646495703,
    rdev: 0,
    blksize: 4096,
    ino: 559009303747610050,
    size: 5885,
    blocks: 16,
    atimeMs: 1662649660000,
    mtimeMs: 1662649660000,
    ctimeMs: 1662649660000,
    birthtimeMs: 1662649660000,
    atime: 2022-09-08T15:07:40.000Z,
    mtime: 2022-09-08T15:07:40.000Z,
    ctime: 2022-09-08T15:07:40.000Z,
    birthtime: 2022-09-08T15:07:40.000Z
  }
*/