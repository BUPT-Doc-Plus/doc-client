<template>
  <div>
    <div class="container">
      <h3>{{ greeting }}, {{ user.nickname }}！</h3>
      <div style="margin: 1rem 0">
        <div
          style="border-bottom: 1px dashed #666; margin: 0rem -.5rem; padding: .5rem .5rem;"
          class="info current">{{ user.nickname }} - {{ user.email }}</div>
        <div
          style="border-bottom: 1px dashed #666; margin: 0rem -.5rem; padding: .5rem .5rem;"
          v-for="(item, i) in allUsers.filter(e => e.data.email !== user.email)"
          :key="i"
          class="other">
          <div class="info account">
            {{ item.data.nickname }} - {{ item.data.email }}
          </div>
          <div class="switch">
            <i class="el-icon-sort" @click="switchAccount(item)" />
            <i class="el-icon-delete" @click="deleteAccount(item)" />
          </div>
        </div>
      </div>
      <div class="btns">
        <el-button type="info" @click="addUser()" plain>{{addingUser ? "取消" : "添加用户"}}</el-button>
        <el-button type="info" @click="logout()" plain>注销</el-button>
      </div>
      <Login v-if="addingUser" @complete="addUserComplete" :inline="true" />
    </div>
  </div>
</template>

<script>
import API from "../biz/API";
import AuthorAPI from "../biz/AuthorAPI";
import Login from "../pages/Login";

export default {
  inject: ["reload"],
  components: { Login },
  created() {
    let now = new Date().getHours();
    if (now < 5) this.greeting = "夜深了，早点休息";
    else if (now >= 5 && now < 10) this.greeting = "早上好";
    else if (now >= 10 && now < 12) this.greeting = "上午好";
    else if (now === 12) this.greeting = "中午好";
    else if (now > 12 && now < 17) this.greeting = "下午好";
    else if (now > 17 && now <= 23) this.greeting = "晚上好";
    API.currentUser().then((resp) => {
      this.user = resp.data.data;
      if (localStorage.getItem("allUsers") === null) {
        localStorage.setItem(
          "allUsers",
          JSON.stringify([{ token: API.token(), data: this.user }])
        );
      }
      this.allUsers = JSON.parse(localStorage.getItem("allUsers"));
    })
  },
  data() {
    return {
      user: {
        nickname: "",
        email: "",
      },
      greeting: "",
      addingUser: false,
      allUsers: [],
    };
  },
  methods: {
    logout() {
      localStorage.removeItem("token");
      this.$router.replace("/login/");
    },
    addUser() {
      this.addingUser = !this.addingUser;
    },
    addUserComplete(token) {
      API.revealToken(token).then((resp) => {
        if (localStorage.getItem("allUsers") === null) {
          localStorage.setItem(
            "allUsers",
            JSON.stringify([{ token: API.token(), data: this.user }])
          );
        }
        let allUsers = JSON.parse(localStorage.getItem("allUsers"));
        allUsers.push({
          token,
          data: resp.data.data,
        });
        this.allUsers = allUsers;
        localStorage.setItem("allUsers", JSON.stringify(allUsers));
        this.addingUser = false;
      });
    },
    switchAccount(item) {
      this.$confirm(`确定切换到用户"${item.data.nickname} - ${item.data.email}"?`, "切换用户", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        localStorage.setItem("token", item.token);
        API.currentUser(true).then((resp) => {
          this.reload();
        })
      })
    },
    deleteAccount(item) {
      this.$confirm(`确定删除用户"${item.data.nickname} - ${item.data.email}"?`, "删除用户", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        let allUsers = JSON.parse(localStorage.getItem("allUsers"));
        let idx = -1;
        for (let i = 0; i < allUsers.length; ++i) {
          if (allUsers[i].token === item.token) {
            idx = i;
            break;
          }
        }
        if (idx === -1) return;
        allUsers.splice(idx, 1);
        this.allUsers = allUsers;
        localStorage.setItem("allUsers", JSON.stringify(allUsers));
      })
    }
  },
};
</script>

<style scoped>
.container {
  margin: 1rem;
}
.info {
  color: #666;
}
.btns {
  display: flex;
  justify-content: center;
}
.other {
  display: flex;
}
.account {
  flex: 1;
  justify-self: flex-start;
}
.el-icon-sort,.el-icon-delete {
  cursor: pointer;
}
.current {
  font-weight: bold;
}
</style>