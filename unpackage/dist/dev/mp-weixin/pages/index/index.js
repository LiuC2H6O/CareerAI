"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const careerService = common_vendor.tr.importObject("career-service");
    const dashboard = common_vendor.ref({
      profile: null,
      assessmentCount: 0,
      aiCount: 0,
      topSkills: []
    });
    const currentDate = common_vendor.ref("");
    const initDate = () => {
      const d = /* @__PURE__ */ new Date();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      currentDate.value = `${month}月${day}日`;
    };
    const getSkillName = (code) => {
      const map = {
        "logic": "逻辑思维",
        "professional": "专业基础",
        "communication": "沟通表达",
        "digital": "数字技能",
        "practice": "实践能力",
        "career": "求职能力"
      };
      return map[code] || code;
    };
    const loadData = async () => {
      try {
        const res = await careerService.getDashboardData();
        if (res.code === 0) {
          dashboard.value = res.data;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:130", "获取首页数据失败", e);
      }
    };
    common_vendor.onMounted(() => {
      initDate();
    });
    common_vendor.onShow(() => {
      loadData();
    });
    const goToProfile = () => {
      common_vendor.index.switchTab({
        url: "/pages/career/explore"
      });
    };
    const goToAssessment = () => {
      common_vendor.index.switchTab({
        url: "/pages/assessment/index"
      });
    };
    const goToJobs = () => {
      common_vendor.index.navigateTo({
        url: "/pages/career/jobs"
      });
    };
    const goToResume = () => {
      common_vendor.index.navigateTo({
        url: "/pages/coach/resume"
      });
    };
    const goToInterview = () => {
      common_vendor.index.navigateTo({
        url: "/pages/coach/interview"
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(currentDate.value),
        b: !dashboard.value.profile
      }, !dashboard.value.profile ? {} : {}, {
        c: common_vendor.o(goToProfile),
        d: !dashboard.value.profile
      }, !dashboard.value.profile ? {
        e: common_vendor.o(goToProfile)
      } : {}, {
        f: common_vendor.t(dashboard.value.assessmentCount),
        g: common_vendor.t(dashboard.value.aiCount),
        h: common_vendor.t(dashboard.value.profile ? dashboard.value.profile.major : "--"),
        i: common_vendor.o(goToAssessment),
        j: common_vendor.o(goToJobs),
        k: common_vendor.o(goToResume),
        l: common_vendor.o(goToInterview),
        m: dashboard.value.topSkills.length > 0
      }, dashboard.value.topSkills.length > 0 ? {} : {}, {
        n: dashboard.value.topSkills.length > 0
      }, dashboard.value.topSkills.length > 0 ? {
        o: common_vendor.f(dashboard.value.topSkills, (skill, k0, i0) => {
          return {
            a: common_vendor.t(getSkillName(skill.skill_code)),
            b: skill.score + "%",
            c: common_vendor.t(skill.score),
            d: skill._id
          };
        })
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
