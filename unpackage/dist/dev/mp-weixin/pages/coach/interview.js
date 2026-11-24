"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "interview",
  setup(__props) {
    const step = common_vendor.ref(0);
    const question = common_vendor.ref("");
    const answer = common_vendor.ref("");
    const feedback = common_vendor.ref(null);
    const loading = common_vendor.ref(false);
    const aiService = common_vendor.tr.importObject("ai-service");
    const startInterview = async () => {
      common_vendor.index.showLoading({
        title: "面试官准备中..."
      });
      try {
        const res = await aiService.interviewQuestion({
          targetJob: "前端开发"
        });
        if (res.code === 0) {
          question.value = res.data;
          step.value = 1;
        } else {
          common_vendor.index.showToast({
            title: res.message,
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.showToast({
          title: "网络异常",
          icon: "none"
        });
      }
      common_vendor.index.hideLoading();
    };
    const submitAnswer = async () => {
      if (answer.value.length < 10) {
        return common_vendor.index.showToast({
          title: "回答太短啦，至少10个字",
          icon: "none"
        });
      }
      loading.value = true;
      try {
        const res = await aiService.interviewFeedback({
          question: question.value,
          answer: answer.value
        });
        if (res.code === 0) {
          feedback.value = res.data;
          step.value = 2;
        } else {
          common_vendor.index.showToast({
            title: res.message,
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.showToast({
          title: "评分失败",
          icon: "none"
        });
      }
      loading.value = false;
    };
    const reset = () => {
      step.value = 0;
      question.value = "";
      answer.value = "";
      feedback.value = null;
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: step.value === 0
      }, step.value === 0 ? {
        b: common_vendor.o(startInterview)
      } : {}, {
        c: step.value === 1
      }, step.value === 1 ? {
        d: common_vendor.t(question.value),
        e: answer.value,
        f: common_vendor.o(($event) => answer.value = $event.detail.value),
        g: common_vendor.t(loading.value ? "AI 正在评分..." : "提交回答"),
        h: loading.value,
        i: common_vendor.o(submitAnswer)
      } : {}, {
        j: step.value === 2
      }, step.value === 2 ? {
        k: common_vendor.t(feedback.value.score),
        l: common_vendor.f(feedback.value.highlights, (item, i, i0) => {
          return {
            a: common_vendor.t(item),
            b: "h" + i
          };
        }),
        m: common_vendor.f(feedback.value.suggestions, (item, i, i0) => {
          return {
            a: common_vendor.t(item),
            b: "s" + i
          };
        }),
        n: common_vendor.o(reset)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a67ab2e2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/coach/interview.js.map
