const Saxophone = require('saxophone');


async function parse(input) {
  const saxophoneParser = new Saxophone();
  const currentElementNodeTemplate = {
    id: 0,
    element: {},
    parent: 0,
    text: '',
  };
  const nodes = [];
  let currentElementNode;
  let nodeId = 0;
  saxophoneParser.on('tagopen', (tag) => {
    nodeId += 1;
    if (currentElementNode && currentElementNode.id !== 0) {
      nodes.push(currentElementNode);
    }
    currentElementNode = Object.create(currentElementNodeTemplate);

    currentElementNode.id += nodeId;
    currentElementNode.element = {};
    currentElementNode.element.name = tag.name;
    currentElementNode.element.isSelfClosing = tag.isSelfClosing;

    const attrs = Saxophone.parseAttrs(tag.attrs);
    delete attrs['xml:id'];
    currentElementNode.element.attributes = attrs;
    currentElementNode.parent = (currentElementNode) ? currentElementNode.id - 1 : null;
  });

  saxophoneParser.on('text', (text) => {
    if (!text.contents.match(/(\n|\s{2,})/g)) {
      currentElementNode.element.text = text.contents;
    }
  });

  saxophoneParser.on('finish', () => {
  });

  saxophoneParser.parse(input);
  return nodes;
}

module.exports = {
  parse,
};
