"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "explore",
  setup(__props) {
    const formData = common_vendor.ref({
      major: "",
      grade: "",
      school: ""
    });
    const careerService = common_vendor.tr.importObject("career-service");
    const read = async () => {
      common_vendor.index.showLoading({
        title: "读取中..."
      });
      try {
        const res = await careerService.getProfile();
        if (res.code === 0 && res.data) {
          formData.value = {
            major: res.data.major,
            grade: res.data.grade,
            school: res.data.school
          };
          common_vendor.index.showToast({
            title: "读取成功",
            icon: "none"
          });
        } else {
          common_vendor.index.showToast({
            title: "暂无档案",
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/career/explore.vue:67", "【读取档案】完整错误对象:", e);
        common_vendor.index.showToast({
          title: e.message || "读取失败",
          icon: "none"
        });
      }
      common_vendor.index.hideLoading();
    };
    const save = async () => {
      if (!formData.value.major || !formData.value.grade) {
        return common_vendor.index.showToast({
          title: "请填写专业和年级",
          icon: "none"
        });
      }
      common_vendor.index.showLoading({
        title: "保存中..."
      });
      try {
        const res = await careerService.saveProfile(formData.value);
        if (res.code === 0) {
          common_vendor.index.showToast({
            title: "保存成功",
            icon: "success"
          });
        } else {
          common_vendor.index.showToast({
            title: res.message,
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/career/explore.vue:104", "【读取档案】完整错误对象:", e);
        common_vendor.index.showToast({
          title: e.message || "读取失败",
          icon: "none"
        });
      }
      common_vendor.index.hideLoading();
    };
    common_vendor.onMounted(() => {
      read();
    });
    return (_ctx, _cache) => {
      return {
        a: formData.value.major,
        b: common_vendor.o(($event) => formData.value.major = $event.detail.value),
        c: formData.value.grade,
        d: common_vendor.o(($event) => formData.value.grade = $event.detail.value),
        e: formData.value.school,
        f: common_vendor.o(($event) => formData.value.school = $event.detail.value),
        g: common_vendor.o(save),
        h: common_vendor.o(read),
        i: common_vendor.o(($event) => common_vendor.index.navigateTo({
          url: "/pages/career/jobs"
        }))
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d70220f4"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/career/explore.js.map
