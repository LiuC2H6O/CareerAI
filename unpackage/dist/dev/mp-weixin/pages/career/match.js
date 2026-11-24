"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "match",
  setup(__props) {
    const matchData = common_vendor.ref(null);
    const careerService = common_vendor.tr.importObject("career-service");
    common_vendor.onLoad((options) => {
      if (options.jobId) {
        loadMatchData(options.jobId);
      }
    });
    const loadMatchData = async (jobId) => {
      common_vendor.index.showLoading({
        title: "计算匹配度..."
      });
      try {
        const res = await careerService.matchJob(jobId);
        if (res.code === 0) {
          matchData.value = res.data;
        } else {
          common_vendor.index.showToast({
            title: res.message,
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/career/match.vue:63", e);
      }
      common_vendor.index.hideLoading();
    };
    const missingText = common_vendor.computed(() => {
      if (!matchData.value || !matchData.value.missingSkills)
        return "";
      return matchData.value.missingSkills.join(", ");
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: matchData.value
      }, matchData.value ? common_vendor.e({
        b: common_vendor.t(matchData.value.job.job_name),
        c: common_vendor.t(matchData.value.matchScore),
        d: matchData.value.missingSkills.length > 0
      }, matchData.value.missingSkills.length > 0 ? {
        e: common_vendor.t(missingText.value)
      } : {}, {
        f: common_vendor.f(matchData.value.details, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.skill_code),
            b: common_vendor.t(item.weight * 100),
            c: common_vendor.t(item.status === "missing" ? "暂无数据" : "你的得分: " + item.user_score),
            d: item.status === "missing" ? 1 : "",
            e: item.skill_code
          };
        })
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6ed0212a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/career/match.js.map
