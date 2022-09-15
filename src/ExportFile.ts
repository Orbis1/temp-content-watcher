import path from "path";
import { renameSync, existsSync } from "fs";

interface FileProps {
  root: string,
  dir: string,
  base: string,
  ext: string,
  name: string
}

class ExportFile {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
  prevName: string; 
  uid: number;

  constructor(filePath: string, uid: number) {
    const { root, dir, base, ext, name }: FileProps = path.parse(filePath);
    this.root = root;
    this.dir = dir;
    this.base = base;
    this.ext = ext;
    this.name = name;
    this.prevName = name;
    this.uid = uid;
  }

  rename(newName: string): boolean {
    try {
      const oldPath: string = path.join(this.dir, this.name + this.ext);
      const newPath: string = path.join(this.dir, newName + this.ext);
      renameSync(oldPath, newPath);
      console.log({ oldPath, newPath });
    } catch (error: unknown) {
      if(error.code !== "EBUSY") throw new Error(`Rename file error`);


      
      setTimeout(this.rename, 1000);
    }
    return existsSync(newName);
  }
}

export { ExportFile };