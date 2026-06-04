function parseActionIntent(text) {
  const raw = String(text || '').trim();
  const normalized = normalize(raw);

  const explicitUrl = raw.match(/https?:\/\/[^\s，。]+/i)?.[0];
  if (explicitUrl && /打开|访问|浏览/.test(raw)) {
    return {
      toolName: 'browser.open_url',
      args: { url: explicitUrl }
    };
  }

  const searchQuery = extractAfter(raw, [
    '浏览器搜索',
    '浏览器搜一下',
    '浏览器搜',
    '帮我搜索',
    '帮我搜一下',
    '帮我搜',
    '搜索一下',
    '搜一下',
    '搜索',
    '搜',
    '查一下',
    '查询',
    '找一下',
    '找一找'
  ]);
  if (searchQuery && /(搜索|搜一下|搜|查询|查一下|找一下|找一找|浏览器)/.test(raw)) {
    return {
      toolName: 'browser.search_web',
      args: { query: cleanupTitle(searchQuery) }
    };
  }

  if (/(word|文档|doc)/i.test(normalized) && /(创建|新建|生成|写一个|做一个)/.test(raw)) {
    return {
      toolName: 'office.create_word_document',
      args: {
        title: extractTitle(raw, '新建文档'),
        body: raw
      }
    };
  }

  if (/(excel|表格|工作簿|xlsx)/i.test(normalized) && /(创建|新建|生成|做一个)/.test(raw)) {
    return {
      toolName: 'office.create_excel_workbook',
      args: {
        title: extractTitle(raw, '新建表格')
      }
    };
  }

  if (/(ppt|powerpoint|演示|幻灯片)/i.test(normalized) && /(创建|新建|生成|做一个)/.test(raw)) {
    return {
      toolName: 'office.create_powerpoint_deck',
      args: {
        title: extractTitle(raw, '新建演示文稿')
      }
    };
  }

  return null;
}

function normalize(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, '');
}

function extractAfter(text, markers) {
  for (const marker of markers) {
    const index = text.indexOf(marker);
    if (index !== -1) {
      return text.slice(index + marker.length);
    }
  }
  return '';
}

function extractTitle(text, fallback) {
  const match = text.match(/标题(?:是|为|叫)?([^，。,.]+)/);
  if (match?.[1]) {
    return cleanupTitle(match[1]);
  }

  const named = text.match(/(?:叫|名为|名字是)([^，。,.]+)/);
  if (named?.[1]) {
    return cleanupTitle(named[1]);
  }

  return fallback;
}

function cleanupTitle(text) {
  return String(text || '')
    .replace(/^(一下|一下关于|关于|是|为|叫|名为)/, '')
    .replace(/[。,.，！!？?]$/g, '')
    .trim();
}

module.exports = {
  parseActionIntent
};
