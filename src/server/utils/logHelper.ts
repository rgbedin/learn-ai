import fs from "fs";
import path from "path";

export class FileLogger {
  readonly uid: string;
  readonly outputPath: string;

  constructor(uid: string) {
    this.uid = uid;
    this.outputPath = "";

    if (process.env.LOG_SUMMARIES_LOCALLY && !fs.existsSync(this.outputPath)) {
      this.outputPath = path.join("output", `${this.uid}`, `${Date.now()}`);
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  logToFile(filename: string, message: string) {
    if (!process.env.LOG_SUMMARIES_LOCALLY) return;

    fs.appendFile(
      path.join(this.outputPath, filename),
      `${message}\n`,
      (err) => {
        if (err) throw err;
        console.log(`Logged to ${filename}`);
      },
    );
  }
}
