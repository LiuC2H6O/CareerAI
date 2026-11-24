"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "ai-coach",
  setup(__props) {
    const goToInterview = () => {
      common_vendor.index.navigateTo({ url: "/pages/coach/interview" });
    };
    const goToResume = () => {
      common_vendor.index.navigateTo({
        url: "/pages/coach/resume"
      });
    };
    const todo = () => {
      common_vendor.index.__f__("log", "at pages/coach/ai-coach.vue:47", {
        title: "该功能正在开发中...",
        icon: "none"
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(goToResume),
        b: common_vendor.o(goToInterview),
        c: common_vendor.o(todo)
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-587d7ca9"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/coach/ai-coach.js.map
