<template>
  <div class="full">
    <el-container class="full">
      <el-header v-if="!inline" class="head" style="height: 30px"></el-header>
      <el-container id="main">
        <el-main class="form">
          <h1 v-if="!inline" class="welcome">
            <div>Doc+</div>
            <div class="btns">
              <span
                v-loading="submittingInfo"
                element-loading-background="rgba(255, 255, 255, 1)">
                <i
                  class="el-icon-right btn"
                  @click="next()"/>
              </span>
            </div>
          </h1>
          <el-input
            id="input-e"
            :class="inputClassName['input-e']"
            ref="input-e"
            @keyup.enter.native="next()"
            v-show="step === 0"
            v-model="input.email"
            placeholder="邮箱"
            :disabled="submittingInfo"
          ></el-input>
          <el-input
            ref="input-n"
            :class="inputClassName['input-n']"
            @keyup.enter.native="$refs['input-p'].focus()"
            v-show="step === 2"
            v-model="input.nickname"
            placeholder="昵称"
            :disabled="submittingInfo"
          ></el-input>
          <el-input
            ref="input-p"
            :class="inputClassName['input-p']"
            @keyup.enter.native="step === 1 ? next() : $refs['input-a'].focus()"
            v-show="step === 1 || step === 2"
            v-model="input.password"
            type="password"
            placeholder="密码"
            :disabled="submittingInfo"
          ></el-input>
          <el-button v-show="step === 1" type="text">忘记密码</el-button>
          <el-input
            ref="input-a"
            :class="inputClassName['input-a']"
            @keyup.enter.native="next()"
            v-show="step === 2"
            v-model="input.pwdAgain"
            type="password"
            placeholder="确认密码"
            :disabled="submittingInfo"
          ></el-input>
          <el-input
            ref="input-v"
            :class="inputClassName['input-v']"
            @keyup.enter.native="next()"
            v-show="step === 3"
            v-model="input.validCode"
            placeholder="验证码"
            :disabled="submittingInfo"
          ></el-input>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import API from '../biz/API';
import AuthorAPI from "../biz/AuthorAPI";
import DocAPI from "../biz/DocAPI";

export default {
  props: ["inline"],
  data() {
    return {
      step: 0,
      input: {
        nickname: "",
        email: "",
        password: "",
        pwdAgain: "",
        validCode: "",
      },
      token: "",
      inputClassName: {
        "input-e": "",
        "input-n": "",
        "input-p": "",
        "input-a": "",
        "input-v": "",
      },
      submittingInfo: false
    };
  },
  created() {
    this.$nextTick(() => {
      this.$refs["input-e"].focus();
    });
  },
  methods: {
    shakeSomething(id) {
      this.inputClassName[id] = "shake-input";
      setTimeout(() => {
        this.inputClassName[id] = "";
      }, 250);
    },
    _replaceTokenInStoredAccount(userData, newToken) {
      let allUsers = localStorage.getItem("allUsers");
      let contains = false;
      if (allUsers) {
        allUsers = JSON.parse(allUsers);
        for (let item of allUsers) {
          if (item.data.id == userData.id) {
            item.token = newToken;
            contains = true;
          }
        }
        if (!contains) {
          allUsers.push({
            token: newToken,
            data: userData
          })
        }
        localStorage.setItem("allUsers", JSON.stringify(allUsers));
      }
    },
    next() {
      this.submittingInfo = true;
      if (this.step === 0) {        
        if (!/^[\.a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(this.input.email)) {
          this.shakeSomething("input-e")
          this.$message({
            type: "error",
            message: "请输入正确的邮箱地址",
          });
          this.$nextTick(() => {
            this.$refs["input-e"].focus();
          })
          this.submittingInfo = false;
          return;
        }
        AuthorAPI.exist(this.input.email)
          .then((resp) => {
            if (resp.data.data === null || resp.data.data.active === false) {
              this.step = 2;
              this.$message({
                type: "success",
                message: "请您填写注册信息"
              })
              this.$nextTick(() => {
                this.$refs["input-n"].focus();
              });
            } else {
              this.step = 1;
              this.$message({
                type: "success",
                message: "您已注册，请登录"
              })
              this.$nextTick(() => {
                this.$refs["input-p"].focus();
              });
            }
            this.submittingInfo = false;
          })
          .catch((err) => {
            this.$message({
              type: "error",
              message: err.response.data.msg,
            });
            this.submittingInfo = false;
          });
      } else if (this.step === 1) {
        AuthorAPI.login(this.input.email, this.input.password)
          .then((resp) => {
            if (!this.inline) {
              localStorage.setItem("token", resp.data.data);
              API.currentUser().then((u) => {
                this._replaceTokenInStoredAccount(u.data.data, resp.data.data);
              })
              this.$router.replace({ path: "/" });
            } else {
              this.$emit("complete", resp.data.data)
            }
            this.submittingInfo = false;
          })
          .catch((err) => {
            this.shakeSomething("input-p")
            this.$message({
              type: "error",
              message: err.response.data.msg,
            });
            this.$nextTick(() => {
              this.$refs["input-p"].focus();
            })
            this.submittingInfo = false;
          });
      } else if (this.step === 2) {
        if (this.input.password !== this.input.pwdAgain) {
          this.shakeSomething("input-a")
          this.$message({
            type: "error",
            message: "两次密码不一致",
          });
          this.$refs["input-a"].focus();
          this.submittingInfo = false;
          return;
        }
        AuthorAPI.register(
          this.input.nickname,
          this.input.email,
          this.input.password
        )
          .then((resp) => {
            this.token = resp.data.data;
            this.step = 3;
            this.submittingInfo = false;
          })
          .catch((err) => {
            this.$message({
              type: "error",
              message: err.response.data.msg,
            });
            this.submittingInfo = false;
          });
      } else if (this.step === 3) {
        AuthorAPI.activate(this.input.validCode, this.token)
          .then((resp) => {
            if (!this.inline) {
              localStorage.setItem("token", resp.data.data);
              API.currentUser().then((u) => {
                this._replaceTokenInStoredAccount(u.data.data, resp.data.data);
              })
              this.$router.replace({ path: "/" });
            } else {
              this.$emit("complete", resp.data.data)
            }
            this.submittingInfo = false;
          })
          .catch((err) => {
            this.shakeSomething("input-v")
            this.$message({
              type: "error",
              message: err.response.data.msg,
            });
            this.$refs["input-v"].focus();
            this.submittingInfo = false;
          });
      }
    },
  },
};
</script>

<style scoped>
@keyframes shake {
  0% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(5px, 0);
  }
  50% {
    transform: translate(10px, 0);
  }
  75% {
    transform: translate(5px, 0);
  }
  100% {
    transform: translate(0, 0);
  }
}
#main {
  display: flex;
  justify-content: center;
}
.head {
  background: rgb(221, 221, 221);
}
.form {
  display: flex;
  flex-direction: column;
  align-self: center;
  min-width: 200px;
  max-width: 500px;
}
.form > .el-input {
  margin: 1rem 0;
}
.shake-input {
  margin: 1rem 0;
  animation: shake 100ms infinite;
}
.welcome {
  color: #666;
  user-select: none;
  display: flex;
}
.welcome > div {
  display: flex;
}
.btns {
  flex: 1;
  justify-content: flex-end;
}
.btn {
  cursor: pointer;
}
.btn:hover {
  color: #ccc;
}
</style>