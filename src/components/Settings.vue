<template>
  <div>
    <div class="btns">
      <h3>{{greeting}}, {{user.nickname}}！</h3>
      <el-button type="danger" @click.native="logout()">退出登录</el-button>
      <p class="info">&lt;{{user.email}}&gt;</p>
    </div>
  </div>
</template>

<script>
import API from "../biz/API";
import AuthorAPI from "../biz/AuthorAPI";
export default {
  created() {
    let now = new Date().getHours();
    if (now < 5) this.greeting = "夜深了";
    else if (now >= 5 && now < 10) this.greeting = "早上好";
    else if (now >= 10 && now < 12) this.greeting = "上午好";
    else if (now === 12) this.greeting = "中午好";
    else if (now > 12 && now < 17) this.greeting = "下午好";
    else if (now > 17 && now <= 23) this.greeting = "晚上好";
    API.currentUser().then((resp) => {
      this.user = resp.data.data;
    })
  },
  data() {
    return {
      user: {
        nickname: "",
        email: "",
      },
      greeting: "",
    };
  },
  methods: {
    logout() {
      localStorage.removeItem("token");
      this.$router.replace("/login/");
    },
  },
};
</script>

<style scoped>
.btns {
  margin: 1rem;
}
.btns .el-button {
  width: 100%;
}
.info {
  text-align: center;
  color: #666;
}
</style>