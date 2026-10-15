/* Entry point. Each feature is its own module and loads on its own, so one failing never takes the rest down. */
['sfx', 'glass', 'diagrams', 'terminal', 'story', 'carousel', 'hero'].forEach((name) =>
  import('./' + name + '.js').catch((err) => console.warn('[portfolio] ' + name + ' failed to load', err)),
);
