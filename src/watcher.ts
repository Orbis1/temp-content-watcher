import 'dotenv/config';
import chokidar from "chokidar";
import { onAdd } from './handler';

const watching: string = process.env.QS_TEMP_CONTENT_DIRS || '';

const config = {
  ignored: /(~\$|_).*\.xlsx|.*\.env|.*\.qvf|.*\.swp|.DS_Store/, // ignore files, (witch start on ~$ or _ and end on .xlsx) or .env etc.
  persistent: true,
  ignoreInitial: false,
}

const watcher = chokidar.watch(watching, config);

watcher.on("add", onAdd);