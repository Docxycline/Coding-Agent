import { tool } from "@langchain/core/tools";
import { string, z } from "zod";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

export const readFileTool = tool(
    async({file_path})=>{
        try{
            const absolutePath = path.resolve(file_path);
            const content = await fs.readFile(absolutePath,"utf-8");
            return content;
        }catch(err: any){
            return "error reading file:"
        }
    },
    {
      name:"readfile",
      description:"Read the contents of a file at the given path. Use this when you need to understand existing code before making changes.",
      schema: z.object({
        file_path: z.string().describe("The path to the file to read, can be relative or absolute"),
      }),
    }
);
const BLOCKED_PATTERNS = [
    /node_modules/,
    /\.env/,
    /\.git\\/
];
export const write_fileTool = tool(
    async({file_path, content})=>{
        try{
            const isBlocked = BLOCKED_PATTERNS.some((patern)=>
            patern.test(file_path)
        );
        if(isBlocked){
            return `Error: Writing to ${file_path} is not allowed for safety reasons.`;
        }
        const absolutePath = path.resolve(file_path);
        await fs.mkdir(path.dirname(absolutePath),{recursive:true});
        await fs.writeFile(absolutePath,content,"utf-8");
        return `Successfully wrote to ${file_path}`;
        }catch(err: any){
            return `Error writing file: ${err.message}`;
        }  
    },
    {
    name: "write_file",
    description:
      "Write content to a file at the given path. Creates the file if it doesn't exist, overwrites it if it does. Use this to create new files or completely rewrite existing ones.",
    schema: z.object({
      file_path: z
        .string()
        .describe("The path to the file to write to, can be relative or absolute"),
      content: z.string().describe("The full content to write to the file"),
    }),
  }
);

export const listDirectorytool= tool(
    async({dir_path})=>{
        try{
            const absolutePath = path.resolve(dir_path);
            const entries = await fs.readdir(absolutePath,{withFileTypes:true})

            const filetered = entries.filter(
                (entry)=>
                    entry.name !== "node_modules"&&
                    entry.name !== ".git"&&
                    entry.name !== ".next"&&
                    !entry.name.startsWith(".")

            );
            const result = filetered.map((entry)=>{
                const type = entry.isDirectory()? "📁" : "📄";
                return `${type}${entry.name}`;
            });
            return result.length>0
            ? result.join("\n")
            :"Directory is empty";
        } catch (err: any) {
            return `Error reading directory: ${err.message}`;
        }
    },
  {
    name: "list_directory",
    description:
      "List all files and folders in a directory. Use this to understand the structure of a project before reading or editing files.",
    schema: z.object({
      dir_path: z
        .string()
        .describe("The path to the directory to list, can be relative or absolute"),
    }),
  }
);

export const editingFileTool = tool(
    async({file_path,old_content,new_content})=>{
        try{
            const isBlocked = BLOCKED_PATTERNS.some((pattern)=>
            pattern.test(file_path)
            );
            if (isBlocked) {
            return `Error: Editing ${file_path} is not allowed for safety reasons.`;
            }

            const absolutePath = path.resolve(file_path);
            const currentContent = await fs.readFile(absolutePath, "utf-8");

            if (!currentContent.includes(old_content)) {
                return `Error: Could not find the specified content in ${file_path}. Make sure you read the file first and copy the exact text to replace.`;
            }
            const updatedContent = currentContent.replace(old_content,new_content);
            return `Successfully edited ${file_path}`;
            } catch (err: any) {
                return `Error editing file: ${err.message}`;
            }
        
    },
    {
    name: "edit_file",
    description:
      "Make a targeted edit to a file by replacing a specific piece of existing content with new content. Always read the file first with read_file, then use the exact text you want to replace as old_content. Use this instead of write_file when you only want to change a small part of a file.",
    schema: z.object({
      file_path: z
        .string()
        .describe("The path to the file to edit"),
      old_content: z
        .string()
        .describe("The exact text currently in the file that you want to replace. Must match the file content exactly including whitespace and indentation."),
      new_content: z
        .string()
        .describe("The new text to replace old_content with"),
    }),
  }
);

const execAsync = promisify(exec);
const BLOCKED_COMMANDS = [
  "rm -rf",
  "rmdir /s",
  "del /f",
  "format",
  "mkfs",
  "dd if=",
  ":(){:|:&};:",  // fork bomb
  "shutdown",
  "reboot",
  "halt",
  "kill -9",
  "pkill",
  "chmod 777",
  "sudo rm",
  "git push",   // no accidental pushes
  "npm publish",
]

export const executeCodeTool = tool(
  async ({command, working_directory})=>{
    try{
      const isBlocked = BLOCKED_COMMANDS.some((blocked)=>
      command.toLowerCase().includes(blocked.toLowerCase())
    );
    if (isBlocked) {
        return `Error: Command "${command}" is blocked for safety reasons.`;
      }
    const cwd = working_directory
    ? path.resolve(working_directory)
    : process.cwd();
    const {stdout,stderr}= await execAsync(command,{
      cwd,
      timeout: 30000,
      maxBuffer: 1024*1024,
    });
    let result = "";
    if(stdout) result += `stdout:\n${stdout}`;
    if(stderr) result += `\nstderr:\n${stderr}`
    if(!stdout&&!stderr) result = "Command ran successfully with no output";
    return result;
    }catch(err: any){
        if (err.stdout || err.stderr) {
        let result = "";
        if (err.stdout) result += `stdout:\n${err.stdout}`;
        if (err.stderr) result += `\nstderr:\n${err.stderr}`;
        return `Command failed:\n${result}`;
      }
      if (err.killed) {
        return `Error: Command timed out after 30 seconds`;
      }
      return `Error executing command: ${err.message}`;
    }
  },
  {
    name: "execute_code",
    description:
      "Execute a terminal command on the local machine and return its output. Use this to run code, install packages, run tests, compile code, or any other terminal operation. Always check the output carefully — stderr doesn't always mean failure (many tools write to stderr normally).",
    schema: z.object({
      command: z
        .string()
        .describe("The terminal command to execute, e.g. 'node index.js' or 'npm install' or 'python main.py'"),
      working_directory: z
        .string()
        .optional()
        .describe("The directory to run the command in. Defaults to the current working directory if not specified."),
    }),
  }
);
export const searchInFilesTool = tool(
  async ({ search_term, directory, file_extension }) => {
    try {
      const absolutePath = path.resolve(directory || ".");

      // recursively get all files in the directory
      const getAllFiles = async (dirPath: string): Promise<string[]> => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const files: string[] = [];

        for (const entry of entries) {
          // skip noise
          if (
            entry.name === "node_modules" ||
            entry.name === ".git" ||
            entry.name === ".next" ||
            entry.name.startsWith(".")
          ) {
            continue;
          }

          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            // recursively search subdirectories
            const subFiles = await getAllFiles(fullPath);
            files.push(...subFiles);
          } else {
            // filter by extension if provided
            if (file_extension) {
              if (entry.name.endsWith(file_extension)) {
                files.push(fullPath);
              }
            } else {
              files.push(fullPath);
            }
          }
        }
        return files;
      };

      const allFiles = await getAllFiles(absolutePath);

      // search each file for the term
      const results: string[] = [];

      for (const filePath of allFiles) {
        try {
          const content = await fs.readFile(filePath, "utf-8");
          const lines = content.split("\n");

          lines.forEach((line, index) => {
            if (line.toLowerCase().includes(search_term.toLowerCase())) {
              // return relative path for readability
              const relativePath = path.relative(absolutePath, filePath);
              results.push(`${relativePath}:${index + 1}: ${line.trim()}`);
            }
          });
        } catch {
          // skip binary files or unreadable files silently
        }
      }

      if (results.length === 0) {
        return `No matches found for "${search_term}"`;
      }

      // cap results to avoid overwhelming the LLM
      const capped = results.slice(0, 50);
      const output = capped.join("\n");

      return results.length > 50
        ? `${output}\n\n...and ${results.length - 50} more matches. Narrow your search with file_extension or a more specific term.`
        : output;
    } catch (err: any) {
      return `Error searching files: ${err.message}`;
    }
  },
  {
    name: "search_in_files",
    description:
      "Search for a term across all files in a directory recursively. Returns matching lines with their file path and line number. Use this to find where a function is defined, where a variable is used, or where a specific string appears in the codebase.",
    schema: z.object({
      search_term: z
        .string()
        .describe("The text to search for across files"),
      directory: z
        .string()
        .optional()
        .describe("The directory to search in. Defaults to current directory if not specified."),
      file_extension: z
        .string()
        .optional()
        .describe("Filter files by extension e.g. '.ts' or '.py' or '.js'. Leave empty to search all files."),
    }),
  }
);

export const allTools = [
  readFileTool,
  write_fileTool,
  listDirectorytool,
  editingFileTool,
  executeCodeTool,
  searchInFilesTool,
];