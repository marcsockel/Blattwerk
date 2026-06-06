// Widget: Zahlenstrahl
WIDGETS.push({
  meta: { type:"numberline", label:"Zahlenstrahl", desc:"Lücken eintragen", icon:"↔", category:"mathematik" },
  createData: id => ({ id, type:"numberline", start:0, end:50, step:10, gaps:"20,40" }),
  render: d => {
    const isActive = d.id === selId || _solutionsMode;
    const start=+d.start, end=+d.end, step=+d.step;
    const gaps=new Set((d.gaps||"").split(",").map(n=>parseInt(n.trim())).filter(n=>!isNaN(n)));

    const halfStep = (step===10||step===100||step===1000) ? step/2 : null;

    const points=[];
    for(let i=start;i<=end;i+=step) points.push(i);

    const cellW = step===1 ? 34 : 46;
    const totalW = points.length * cellW;
    const svgW = Math.min(totalW + 30, 540);
    const viewW = totalW + 30;

    const range = end - start;
    const scale = v => 10 + ((v - start) / range) * totalW;

    let ticks="", labels="";

    if (halfStep !== null) {
      for (let i = start; i < end; i += step) {
        const mid = i + halfStep;
        const x = scale(mid);
        ticks += `<line x1="${x}" y1="22" x2="${x}" y2="28" stroke="#999" stroke-width="1"/>`;
      }
    }

    points.forEach((val) => {
      const x = scale(val);
      const isGap = gaps.has(val);
      ticks += `<line x1="${x}" y1="18" x2="${x}" y2="32" stroke="#444" stroke-width="1.5"/>`;
      if (isGap) {
        const boxW = step >= 100 ? 38 : step >= 10 ? 30 : 24;
        const fontSize = step >= 1000 ? 10 : step >= 100 ? 11 : 12;
        if (isActive) {
          labels += `<text x="${x}" y="48" text-anchor="middle" font-family="'Grundschrift',sans-serif" font-size="${fontSize}" font-weight="700" fill="#2563eb">${val}</text>`;
        } else {
          labels += `<rect x="${x - boxW/2}" y="34" width="${boxW}" height="18" rx="2" fill="white" stroke="#555" stroke-width="1.5"/>`;
        }
      } else {
        const fontSize = step >= 1000 ? 10 : step >= 100 ? 11 : 12;
        labels += `<text x="${x}" y="48" text-anchor="middle" font-family="'Grundschrift',sans-serif" font-size="${fontSize}" fill="#333">${val}</text>`;
      }
    });

    const arrowX = 10 + totalW;
    return `<svg width="${svgW}" height="60" viewBox="0 0 ${viewW} 60" style="max-width:100%;">
      <line x1="10" y1="25" x2="${arrowX}" y2="25" stroke="#333" stroke-width="2"/>
      <polygon points="${arrowX+6},25 ${arrowX},22 ${arrowX},28" fill="#333"/>
      ${ticks}${labels}
    </svg>`;
  },
  renderProps: d => {
    const stepSel = `<select onchange="upd(${d.id},'step',+this.value)">
      <option value="1"    ${+d.step===1   ?"selected":""}>1</option>
      <option value="10"   ${+d.step===10  ?"selected":""}>10</option>
      <option value="100"  ${+d.step===100 ?"selected":""}>100</option>
      <option value="1000" ${+d.step===1000?"selected":""}>1000</option>
    </select>`;
    return pr("Start", `<input type="number" value="${d.start}" onchange="upd(${d.id},'start',+this.value)">`) +
      pr("Ende",  `<input type="number" value="${d.end}"   onchange="upd(${d.id},'end',+this.value)">`) +
      pr("Schritt", stepSel) +
      pr("Lücken (kommagetrennte Zahlen)", `<input value="${esc(d.gaps)}" placeholder="z.B. 20,40" onchange="upd(${d.id},'gaps',this.value)">`);
  },
});
