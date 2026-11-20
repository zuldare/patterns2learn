// Renders the cheatsheet's UML structure (Mermaid source in <pre data-uml>) with the active theme's
// tokens, and again whenever the theme changes. Mermaid is loaded only on pages that have a diagram.
const blocks = [...document.querySelectorAll<HTMLElement>('[data-uml]')];

if (blocks.length) {
  const sources = blocks.map(b => b.textContent ?? '');
  const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const render = async () => {
    // The prebuilt ESM bundle: the package's core entry pulls dependencies the site bundler can't resolve.
    const { default: mermaid } = await import('mermaid/dist/mermaid.esm.min.mjs');
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: token('--font'),
      themeVariables: {
        fontFamily: token('--font'),
        fontSize: '13px',
        background: token('--bg'),
        primaryColor: token('--surface'),
        primaryTextColor: token('--ink'),
        primaryBorderColor: token('--ink'),
        secondaryColor: token('--accent-soft'),
        tertiaryColor: token('--bg'),
        lineColor: token('--ink'),
        textColor: token('--ink'),
        mainBkg: token('--surface'),
        classText: token('--ink'),
        nodeBorder: token('--ink'),
      },
      class: { useMaxWidth: true },
    });
    for (const [i, block] of blocks.entries()) {
      try {
        const { svg } = await mermaid.render(`uml-${i}-${Date.now()}`, sources[i]);
        block.innerHTML = svg;
        block.dataset.rendered = 'true';
      } catch (err) {
        block.dataset.rendered = 'error';
        console.error('UML diagram failed to render', err);
      }
    }
  };

  void render();
  new MutationObserver(() => void render()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
