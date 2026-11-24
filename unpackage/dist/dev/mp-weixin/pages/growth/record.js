"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "record",
  setup(__props) {
    const careerService = common_vendor.tr.importObject("career-service");
    const skills = common_vendor.ref([]);
    const rawAssessments = common_vendor.ref([]);
    const rawAiRecords = common_vendor.ref([]);
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      const m = (date.getMonth() + 1).toString().padStart(2, "0");
      const d = date.getDate().toString().padStart(2, "0");
      const h = date.getHours().toString().padStart(2, "0");
      const min = date.getMinutes().toString().padStart(2, "0");
      return `${m}-${d} ${h}:${min}`;
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
    const timelineList = common_vendor.computed(() => {
      const list = [];
      rawAssessments.value.forEach((item) => {
        list.push({
          type: "test",
          timestamp: item.created_at,
          timeStr: formatTime(item.created_at),
          desc: `完成了【${getSkillName(item.category_code)}】测评，得分 ${item.score} 分`
        });
      });
      rawAiRecords.value.forEach((item) => {
        list.push({
          type: "ai",
          timestamp: item.created_at,
          timeStr: formatTime(item.created_at),
          desc: `使用了【AI简历诊断】服务`
        });
      });
      return list.sort((a, b) => b.timestamp - a.timestamp);
    });
    const loadData = async () => {
      common_vendor.index.showLoading({
        title: "加载中..."
      });
      try {
        const res = await careerService.getGrowthOverview();
        if (res.code === 0) {
          skills.value = res.data.skills;
          rawAssessments.value = res.data.assessments;
          rawAiRecords.value = res.data.aiRecords;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/growth/record.vue:122", e);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      }
      common_vendor.index.hideLoading();
    };
    common_vendor.onMounted(() => {
      loadData();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: skills.value.length > 0
      }, skills.value.length > 0 ? {
        b: common_vendor.f(skills.value, (skill, k0, i0) => {
          return {
            a: common_vendor.t(getSkillName(skill.skill_code)),
            b: common_vendor.t(skill.score),
            c: skill.score + "%",
            d: skill._id
          };
        })
      } : {}, {
        c: timelineList.value.length === 0
      }, timelineList.value.length === 0 ? {} : {}, {
        d: common_vendor.f(timelineList.value, (item, index, i0) => {
          return {
            a: common_vendor.t(item.timeStr),
            b: common_vendor.t(item.type === "ai" ? "AI辅导" : "能力测评"),
            c: common_vendor.n(item.type === "ai" ? "tag-ai" : "tag-test"),
            d: common_vendor.t(item.desc),
            e: index
          };
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-73018daa"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/growth/record.js.map
