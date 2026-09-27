// ui.js：操作面板与视图（原生 DOM，无弹窗）
import { render } from "./app.js";

export function mount(spec, parts) {
  parts.log.textContent = "事件 " + (spec.events || []).length + " 条，定义 " + Object.keys(spec.defs || {}).length + " 个，本轮解析预算 " + (spec.budget || 0) + " 个名字。";

  function draw() {
    let view = null;
    try {
      view = render(spec);
    } catch (error) {
      parts.out.textContent = String(error && error.code ? error.code : error);
      parts.log.textContent = "跑不动：" + String(error && error.message ? error.message : error);
      return;
    }
    parts.out.textContent = JSON.stringify(view, null, 1);
    parts.stage.textContent = "";
    (view.resolved || []).forEach(function (row) {
      const line = document.createElement("div");
      line.className = "row";
      const head = document.createElement("span");
      head.textContent = row[0] + " 展开成 " + row[1];
      line.appendChild(head);
      const chip = document.createElement("span");
      chip.className = "chip ok";
      chip.textContent = "已解析";
      line.appendChild(chip);
      parts.stage.appendChild(line);
    });
    (view.ledger || []).forEach(function (name) {
      const line = document.createElement("div");
      line.className = "row";
      const head = document.createElement("span");
      head.textContent = "名字 " + name + " 压在账上";
      line.appendChild(head);
      const chip = document.createElement("span");
      chip.className = "chip warn";
      chip.textContent = "等收尾";
      line.appendChild(chip);
      parts.stage.appendChild(line);
    });
    parts.legend.textContent = "已解析 " + view.resolved_count + " 个，首轮解析 "
      + view.resolved_first + " 个，二档 " + view.resolved_wide + " 个，收尾前账 "
      + view.ledger_before + " 个，收尾补齐 " + view.catchup + " 个，收尾后账 " + view.ledger_after + " 个";
    parts.log.textContent = "工作计数 " + view.judged + " / 上界 " + view.judged_bound
      + "，重放新解析 " + view.replay_new + "，与全量对照差异 " + view.full_diff;
  }

  const budgetInput = document.createElement("input");
  budgetInput.type = "number";
  budgetInput.value = "1";
  parts.controls.appendChild(budgetInput);

  const runButton = document.createElement("button");
  runButton.className = "primary";
  runButton.textContent = "跑一遍";
  runButton.addEventListener("click", draw);
  parts.controls.appendChild(runButton);

  const budgetButton = document.createElement("button");
  budgetButton.textContent = "把解析预算换成输入框的值";
  budgetButton.addEventListener("click", function () {
    const next = Number(budgetInput.value);
    spec.budget = Number.isFinite(next) ? Math.max(1, Math.round(next)) : 1;
    draw();
  });
  parts.controls.appendChild(budgetButton);

  const dropButton = document.createElement("button");
  dropButton.textContent = "删最后一条事件";
  dropButton.addEventListener("click", function () {
    spec.events = (spec.events || []).slice(0, Math.max(0, (spec.events || []).length - 1));
    draw();
  });
  parts.controls.appendChild(dropButton);

  draw();
}
