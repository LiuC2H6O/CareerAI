"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const step = common_vendor.ref(1);
    const currentIndex = common_vendor.ref(0);
    const selectedOption = common_vendor.ref(-1);
    const finalScore = common_vendor.ref(0);
    const questions = common_vendor.ref([
      {
        title: "如果所有的A都是B，所有的B都是C，那么以下哪个结论必然正确？",
        options: ["A. 所有的A都是C", "B. 所有的C都是A", "C. 有些A不是C"],
        answer: 0
      },
      {
        title: "1, 3, 6, 10, 15, ( ) 请问括号里填什么？",
        options: ["A. 20", "B. 21", "C. 22"],
        answer: 1
      },
      {
        title: "当团队成员意见不一致时，你通常会优先怎么做？",
        options: ["A. 坚持自己的观点", "B. 倾听各方理由，寻找共识", "C. 随便选一个"],
        answer: 1
      }
    ]);
    const careerService = common_vendor.tr.importObject("career-service");
    const startAssessment = (code) => {
      step.value = 2;
      currentIndex.value = 0;
      selectedOption.value = -1;
    };
    const nextQuestion = async () => {
      if (currentIndex.value < questions.value.length - 1) {
        currentIndex.value++;
        selectedOption.value = -1;
      } else {
        const mockCorrect = 2;
        const total = questions.value.length;
        common_vendor.index.showLoading({
          title: "提交中..."
        });
        try {
          const res = await careerService.submitAssessment({
            category_code: "logic",
            correct_count: mockCorrect,
            total_count: total
          });
          if (res.code === 0) {
            finalScore.value = res.data.score;
            step.value = 3;
          } else {
            common_vendor.index.showToast({
              title: res.message,
              icon: "none"
            });
          }
        } catch (e) {
          common_vendor.index.__f__("error", "at pages/assessment/index.vue:119", e);
          common_vendor.index.showToast({
            title: "提交失败",
            icon: "none"
          });
        }
        common_vendor.index.hideLoading();
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: step.value === 1
      }, step.value === 1 ? {
        b: common_vendor.o(($event) => startAssessment())
      } : {}, {
        c: step.value === 2
      }, step.value === 2 ? {
        d: common_vendor.t(currentIndex.value + 1),
        e: common_vendor.t(questions.value.length),
        f: common_vendor.t(questions.value[currentIndex.value].title),
        g: common_vendor.f(questions.value[currentIndex.value].options, (option, index, i0) => {
          return {
            a: common_vendor.t(option),
            b: index,
            c: selectedOption.value === index ? 1 : "",
            d: common_vendor.o(($event) => selectedOption.value = index, index)
          };
        }),
        h: selectedOption.value === -1,
        i: common_vendor.o(nextQuestion)
      } : {}, {
        j: step.value === 3
      }, step.value === 3 ? {
        k: common_vendor.t(finalScore.value),
        l: common_vendor.o(($event) => step.value = 1)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-290d3d60"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/assessment/index.js.map
