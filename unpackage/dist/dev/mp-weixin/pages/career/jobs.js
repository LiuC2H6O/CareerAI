"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "jobs",
  setup(__props) {
    const jobs = common_vendor.ref([]);
    const careerService = common_vendor.tr.importObject("career-service");
    common_vendor.onMounted(async () => {
      common_vendor.index.showLoading({
        title: "加载中..."
      });
      try {
        const res = await careerService.getJobs();
        if (res.code === 0) {
          jobs.value = res.data;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/career/jobs.vue:37", e);
      }
      common_vendor.index.hideLoading();
    });
    const goToMatch = (jobId) => {
      common_vendor.index.navigateTo({
        url: `/pages/career/match?jobId=${jobId}`
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(jobs.value, (job, k0, i0) => {
          return {
            a: common_vendor.t(job.job_name),
            b: common_vendor.t(job.job_category),
            c: common_vendor.t(job.description),
            d: common_vendor.o(($event) => goToMatch(job._id), job._id),
            e: job._id
          };
        }),
        b: jobs.value.length === 0
      }, jobs.value.length === 0 ? {} : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a277b770"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/career/jobs.js.map
