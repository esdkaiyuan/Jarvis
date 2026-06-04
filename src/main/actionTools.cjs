const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function resolveActionConfig(env = process.env, overrides = {}) {
  const outputDir = overrides.outputDir || env.JARVIS_ACTION_OUTPUT_DIR || path.join(process.cwd(), 'jarvis-actions');
  return {
    dryRun: toBoolean(env.JARVIS_ACTION_DRY_RUN, false),
    outputDir,
    browserSearchUrl: env.JARVIS_BROWSER_SEARCH_URL || 'https://www.bing.com/search?q=',
    openExternal: overrides.openExternal,
    openPath: overrides.openPath,
    now: overrides.now || (() => new Date())
  };
}

function createActionRegistry() {
  const tools = new Map();

  return {
    register(tool) {
      if (!tool?.name || typeof tool.run !== 'function') {
        throw new Error('Invalid action tool.');
      }
      tools.set(tool.name, tool);
    },

    list() {
      return Array.from(tools.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }));
    },

    async run(name, args = {}) {
      const tool = tools.get(name);
      if (!tool) {
        throw new Error(`Unknown action tool: ${name}`);
      }
      return tool.run(args);
    }
  };
}

function createDefaultTools(config = resolveActionConfig()) {
  return [
    createBrowserOpenUrlTool(config),
    createBrowserSearchTool(config),
    createWordTool(config),
    createExcelTool(config),
    createPowerPointTool(config),
    createOfficeOpenFileTool(config)
  ];
}

function createBrowserOpenUrlTool(config) {
  return {
    name: 'browser.open_url',
    description: 'Open a URL in the default browser.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The http or https URL to open.' }
      },
      required: ['url']
    },
    async run(args) {
      const url = normalizeUrl(args.url);
      if (config.dryRun) {
        return ok(`将打开浏览器：${url}`, { dryRun: true, url });
      }

      await openExternal(config, url);
      return ok(`已打开浏览器：${url}`, { url });
    }
  };
}

function createBrowserSearchTool(config) {
  return {
    name: 'browser.search_web',
    description: 'Search the web in the default browser.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query.' }
      },
      required: ['query']
    },
    async run(args) {
      const query = requireText(args.query, 'query');
      const url = `${config.browserSearchUrl}${encodeURIComponent(query)}`;
      if (config.dryRun) {
        return ok(`将搜索：${query}`, { dryRun: true, query, url });
      }

      await openExternal(config, url);
      return ok(`已打开浏览器搜索：${query}`, { query, url });
    }
  };
}

function createWordTool(config) {
  return {
    name: 'office.create_word_document',
    description: 'Create a Word-compatible .docx document.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        fileName: { type: 'string' }
      }
    },
    async run(args) {
      const title = sanitizeTitle(args.title || '贾维斯文档');
      const outputPath = resolveOutputPath(config, args.fileName || `${title}.docx`);
      if (config.dryRun) {
        return ok(`将创建 Word 文档：${outputPath}`, { dryRun: true, path: outputPath });
      }

      const { Document, Packer, Paragraph, HeadingLevel } = require('docx');
      ensureDir(path.dirname(outputPath));
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
              new Paragraph(args.body || '由贾维斯创建。')
            ]
          }
        ]
      });
      fs.writeFileSync(outputPath, await Packer.toBuffer(doc));
      await openPath(config, outputPath);
      return ok(`已创建并打开 Word 文档：${outputPath}`, { path: outputPath });
    }
  };
}

function createExcelTool(config) {
  return {
    name: 'office.create_excel_workbook',
    description: 'Create an Excel .xlsx workbook.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        rows: { type: 'array' },
        fileName: { type: 'string' }
      }
    },
    async run(args) {
      const title = sanitizeTitle(args.title || '贾维斯表格');
      const outputPath = resolveOutputPath(config, args.fileName || `${title}.xlsx`);
      if (config.dryRun) {
        return ok(`将创建 Excel 表格：${outputPath}`, { dryRun: true, path: outputPath });
      }

      const XLSX = require('xlsx');
      ensureDir(path.dirname(outputPath));
      const rows = Array.isArray(args.rows) && args.rows.length ? args.rows : [['项目', '状态', '备注']];
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, outputPath);
      await openPath(config, outputPath);
      return ok(`已创建并打开 Excel 表格：${outputPath}`, { path: outputPath });
    }
  };
}

function createPowerPointTool(config) {
  return {
    name: 'office.create_powerpoint_deck',
    description: 'Create a PowerPoint .pptx deck.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        fileName: { type: 'string' }
      }
    },
    async run(args) {
      const title = sanitizeTitle(args.title || '贾维斯演示文稿');
      const outputPath = resolveOutputPath(config, args.fileName || `${title}.pptx`);
      if (config.dryRun) {
        return ok(`将创建 PowerPoint：${outputPath}`, { dryRun: true, path: outputPath });
      }

      const pptxgen = require('pptxgenjs');
      ensureDir(path.dirname(outputPath));
      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_WIDE';
      const slide = pptx.addSlide();
      slide.addText(title, { x: 0.7, y: 1.5, w: 11.8, h: 0.8, fontSize: 34, bold: true });
      slide.addText(args.subtitle || '由贾维斯创建', { x: 0.7, y: 2.45, w: 10.5, h: 0.4, fontSize: 18 });
      await pptx.writeFile({ fileName: outputPath });
      await openPath(config, outputPath);
      return ok(`已创建并打开 PowerPoint：${outputPath}`, { path: outputPath });
    }
  };
}

function createOfficeOpenFileTool(config) {
  return {
    name: 'office.open_file',
    description: 'Open a file with the system default Office application.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' }
      },
      required: ['path']
    },
    async run(args) {
      const filePath = path.resolve(requireText(args.path, 'path'));
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      if (config.dryRun) {
        return ok(`将打开文件：${filePath}`, { dryRun: true, path: filePath });
      }
      await openPath(config, filePath);
      return ok(`已打开文件：${filePath}`, { path: filePath });
    }
  };
}

function normalizeUrl(value) {
  const url = requireText(value, 'url');
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are allowed.');
  }
  return parsed.toString();
}

function resolveOutputPath(config, fileName) {
  const safeName = sanitizeFileName(fileName);
  const outputDir = path.resolve(config.outputDir);
  const outputPath = path.resolve(outputDir, safeName);
  if (!isInside(outputDir, outputPath)) {
    throw new Error('Output path escapes the configured action output directory.');
  }
  return outputPath;
}

function sanitizeTitle(title) {
  return sanitizeFileName(String(title || 'untitled')).replace(/\.[a-z0-9]+$/i, '') || 'untitled';
}

function sanitizeFileName(fileName) {
  return String(fileName || 'untitled')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .slice(0, 80);
}

function isInside(root, target) {
  const relative = path.relative(root, target);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

function requireText(value, name) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${name} is required.`);
  }
  return text;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function openExternal(config, url) {
  if (config.openExternal) {
    return config.openExternal(url);
  }
  const { shell } = require('electron');
  return shell.openExternal(url);
}

async function openPath(config, filePath) {
  if (config.openPath) {
    return config.openPath(filePath);
  }
  const { shell } = require('electron');
  return shell.openPath(filePath);
}

function ok(message, extra = {}) {
  return {
    ok: true,
    message,
    ...extra
  };
}

function toBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

module.exports = {
  createActionRegistry,
  createDefaultTools,
  resolveActionConfig
};
