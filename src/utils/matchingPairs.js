// Single source of truth for converting matching-question pairs between the
// backend shape and the editor shape, and for grouping pair-rows into visual
// nodes.
//
// Background: the backend stores a matching question as a flat list of
// (leftItem, rightItem) rows. One visual node can appear in several rows (a
// left item linked to several rights => many-to-many), so every screen has to
// group rows back into nodes. This used to be done by CONTENT (text, sometimes
// + image), which silently merged two DISTINCT items that happened to share
// content and dropped image-only items — a teacher who added 4 options saw 1
// in the editor and 3 in the exam. Rows now carry a stable `leftVisualId` /
// `rightVisualId`; group by that and distinct items never merge. Legacy rows
// (saved before visual ids existed) have none, so we fall back to a
// text+image content key — good enough for old data, exact for new data.
//
// Duplicating this logic per-file is what let the screens drift apart in the
// first place, so keep all of it here.

// Does this pair carry a real LEFT / RIGHT side (text or image)? An empty side
// is a distractor row's placeholder (e.g. a right-only node has no left).
export const hasLeftSide = (p) =>
    !!((p.leftItem != null && String(p.leftItem).trim() !== '') || p.attachedImageLeft);
export const hasRightSide = (p) =>
    !!((p.rightItem != null && String(p.rightItem).trim() !== '') || p.attachedImageRight);

// Stable grouping key for a side. Prefers the persisted visual id; falls back
// to a text+image content key for legacy rows. The `c:` prefix keeps a legacy
// content key from ever colliding with a real visual id.
export const leftNodeKey = (p) =>
    p.leftVisualId || `c:${p.leftItem || ''}|${p.attachedImageLeft || ''}`;
export const rightNodeKey = (p) =>
    p.rightVisualId || `c:${p.rightItem || ''}|${p.attachedImageRight || ''}`;

// Column-ordering key. The editor assigns each node a visual id of the form
// `lv-<n>` / `rv-<n>` where <n> is a creation timestamp (Date.now) or the row
// id — both increase with creation order. Sorting nodes by this number makes
// every view (preview, review) show items in the SAME order the teacher built
// them in, instead of the scrambled `orderIndex` order. Legacy rows without a
// visual id all return 0, preserving their existing insertion order.
export const visualOrderKey = (visualId) => {
    const n = parseInt(String(visualId || '').replace(/^[a-z]+-/i, ''), 10);
    return Number.isFinite(n) ? n : 0;
};

// Backend response pair -> editor pair. Assigns a visual id to every side that
// has content, reusing the persisted one when present and otherwise deriving a
// stable one from the content key (so many-to-many rows collapse to one node
// while distinct-content nodes with persisted ids stay separate). Image-only
// sides get a visual id too, which is what makes them render after reload.
export const toEditorMatchingPairs = (pairs, { idAsString = false } = {}) => {
    if (!pairs || pairs.length === 0) return [];
    const lvByKey = {}, rvByKey = {};
    return pairs.map((p) => {
        const id = idAsString ? String(p.id) : p.id;
        let leftVisualId = p.leftVisualId || null;
        if (!leftVisualId && hasLeftSide(p)) {
            const k = leftNodeKey(p);
            if (!lvByKey[k]) lvByKey[k] = `lv-${p.id}`;
            leftVisualId = lvByKey[k];
        }
        let rightVisualId = p.rightVisualId || null;
        if (!rightVisualId && hasRightSide(p)) {
            const k = rightNodeKey(p);
            if (!rvByKey[k]) rvByKey[k] = `rv-${p.id}`;
            rightVisualId = rvByKey[k];
        }
        return {
            id,
            leftItem: p.leftItem || null,
            rightItem: p.rightItem || null,
            attachedImageLeft: p.attachedImageLeft || null,
            attachedImageRight: p.attachedImageRight || null,
            leftVisualId,
            rightVisualId,
        };
    });
};

// Editor pair -> backend request pair. Keeps every row that has content on
// either side (image-only rows included — the old `leftItem || rightItem`
// filter dropped them) and forwards the visual ids so identity survives the
// round-trip. `mapId` lets a caller decide the outgoing id (e.g. null for
// new rows); omit it to send no id at all.
export const toBackendMatchingPairs = (pairs, { mapId } = {}) =>
    (pairs || [])
        .filter((p) => hasLeftSide(p) || hasRightSide(p))
        .map((p, i) => {
            const out = {
                leftItem: p.leftItem || null,
                attachedImageLeft: p.attachedImageLeft || null,
                rightItem: p.rightItem || null,
                attachedImageRight: p.attachedImageRight || null,
                leftVisualId: p.leftVisualId || null,
                rightVisualId: p.rightVisualId || null,
                orderIndex: i,
            };
            if (mapId) out.id = mapId(p.id);
            return out;
        });
