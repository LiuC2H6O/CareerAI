"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "resume",
  setup(__props) {
    const resumeText = common_vendor.ref("");
    const loading = common_vendor.ref(false);
    const result = common_vendor.ref(null);
    const aiService = common_vendor.tr.importObject("ai-service");
    const submit = async () => {
      if (resumeText.value.length < 20) {
        return common_vendor.index.showToast({
          title: "请至少输入20个字",
          icon: "none"
        });
      }
      loading.value = true;
      result.value = null;
      try {
        const res = await aiService.resumeAnalysis({
          text: resumeText.value,
          targetJob: "前端开发"
          // 这里暂时写死，后续可以做成下拉选择
        });
        if (res.code === 0) {
          result.value = res.data;
          common_vendor.index.showToast({
            title: "诊断完成",
            icon: "success"
          });
        } else {
          common_vendor.index.showToast({
            title: res.message,
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/coach/resume.vue:76", e);
        common_vendor.index.showToast({
          title: "网络或服务异常",
          icon: "none"
        });
      }
      loading.value = false;
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: resumeText.value,
        b: common_vendor.o(($event) => resumeText.value = $event.detail.value),
        c: common_vendor.t(loading.value ? "AI 分析中..." : "开始诊断"),
        d: loading.value,
        e: common_vendor.o(submit),
        f: result.value
      }, result.value ? {
        g: common_vendor.f(result.value.advantages, (item, i, i0) => {
          return {
            a: common_vendor.t(item),
            b: "adv" + i
          };
        }),
        h: common_vendor.f(result.value.disadvantages, (item, i, i0) => {
          return {
            a: common_vendor.t(item),
            b: "dis" + i
          };
        }),
        i: common_vendor.f(result.value.suggestions, (item, i, i0) => {
          return {
            a: common_vendor.t(item),
            b: "sug" + i
          };
        })
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6f931d39"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/coach/resume.js.map
