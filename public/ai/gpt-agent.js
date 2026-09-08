export class GPTCompanionBrain {
  constructor() {
    this.enabled = false;
    this.source = 'fallback';
    this.lastDecisionAt = 0;
    this.decision = { intent: 'follow', targetId: null, say: '', reason: 'initial' };
  }

  async refresh(state) {
    const now = performance.now();
    if (now - this.lastDecisionAt < 5000) return this.decision;
    this.lastDecisionAt = now;

    try {
      const response = await fetch('/api/agent/decide', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ state })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.decision = await response.json();
      this.source = this.decision.source || 'server';
      this.enabled = !String(this.source).startsWith('fallback');
    } catch {
      this.decision = this.fallback(state);
      this.source = 'client-fallback';
      this.enabled = false;
    }
    return this.decision;
  }

  fallback(state) {
    if ((state.hpPct ?? 1) < 0.3) return { intent: 'retreat', targetId: null, say: 'Backing off.', reason: 'low health' };
    if (state.nearbyEnemies?.length) return { intent: 'fight', targetId: state.nearbyEnemies[0].id, say: '', reason: 'enemy nearby' };
    return { intent: 'follow', targetId: null, say: '', reason: 'follow player' };
  }
}
