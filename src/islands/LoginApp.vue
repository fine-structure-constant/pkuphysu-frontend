<script setup lang="ts">
import { onMounted, ref } from "vue";
import { apiJson, ApiError, jsonBody } from "../lib/api";
import { hashPassword } from "../lib/password";
import { saveAuthSession, updateStoredUser } from "../lib/session";

type AuthMode = "login" | "register";
type LoginMethod = "account" | "iaaa";
type MessageTone = "error" | "info" | "success";
type TokenResponse = { token: string; username: string; userid: number };

const mode = ref<AuthMode>("login");
const loginMethod = ref<LoginMethod>("account");
const nextPath = ref("/");
const busy = ref(false);
const message = ref("");
const messageTone = ref<MessageTone>("info");
const account = ref("");
const accountPassword = ref("");
const iaaaAccount = ref("");
const iaaaPassword = ref("");
const registerUsername = ref("");
const registerPassword = ref("");
const registerEmail = ref("");
const registerCode = ref("");
const codeSent = ref(false);

const setMessage = (text: string, tone: MessageTone = "info") => { message.value = text; messageTone.value = tone; };
const errorMessage = (error: unknown) => error instanceof ApiError ? error.message : "网络连接失败，请确认后端服务已经启动。";

const finishLogin = async (result: TokenResponse) => {
  saveAuthSession(result.token, { id: result.userid, username: result.username, role: 0 });
  try { updateStoredUser((await apiJson<Record<string, unknown>>("/user/me")).data); } catch { /* Navbar validates the token again when it renders. */ }
  window.location.assign(nextPath.value);
};

const submitAccountLogin = async () => {
  if (busy.value) return;
  busy.value = true; setMessage("正在登录……");
  try {
    const result = await apiJson<TokenResponse>("/auth/login", { method: "POST", body: jsonBody({ username: account.value.trim(), password: await hashPassword(accountPassword.value) }) });
    await finishLogin(result.data);
  } catch (error) { setMessage(errorMessage(error), "error"); } finally { busy.value = false; }
};

const submitIaaaLogin = async () => {
  if (busy.value) return;
  if (!iaaaAccount.value.trim() || !iaaaPassword.value) { setMessage("请输入 IAAA 账号和密码。", "error"); return; }
  busy.value = true; setMessage("正在通过 IAAA 验证……");
  try {
    // The backend forwards the credential to IAAA. It has no private-key
    // decryption step, so production HTTPS protects this request in transit.
    const result = await apiJson<TokenResponse>("/iaaa/login", { method: "POST", body: jsonBody({ username: iaaaAccount.value.trim(), password: iaaaPassword.value }) });
    await finishLogin(result.data);
  } catch (error) { setMessage(errorMessage(error), "error"); } finally { busy.value = false; }
};

const sendCode = async () => {
  const email = registerEmail.value.trim().toLowerCase();
  if (!/^[0-9]+@stu\.pku\.edu\.cn$/.test(email)) { setMessage("注册邮箱需要使用学号邮箱（例如 2300012345@stu.pku.edu.cn）。", "error"); return; }
  try {
    await apiJson("/email/send", { method: "POST", body: jsonBody({ email }) });
    codeSent.value = true; setMessage("验证码已发送到你的邮箱，请查收。", "success");
  } catch (error) { setMessage(errorMessage(error), "error"); }
};

const submitRegister = async () => {
  if (!codeSent.value || !registerCode.value.trim()) { setMessage("请先获取并填写邮箱验证码。", "error"); return; }
  if (registerPassword.value.length < 6) { setMessage("密码至少需要 6 位字符。", "error"); return; }
  busy.value = true; setMessage("正在创建账户……");
  try {
    const result = await apiJson<TokenResponse>("/auth/register", { method: "POST", body: jsonBody({ username: registerUsername.value.trim(), password: await hashPassword(registerPassword.value), email: registerEmail.value.trim().toLowerCase(), code: registerCode.value.trim() }) });
    await finishLogin(result.data);
  } catch (error) { setMessage(errorMessage(error), "error"); } finally { busy.value = false; }
};

onMounted(() => {
  const requestedPath = new URLSearchParams(window.location.search).get("next");
  if (requestedPath?.startsWith("/")) nextPath.value = requestedPath;
});
</script>

<template>
  <div class="auth-shell page-wrap">
    <aside class="auth-intro glass-panel glass-panel--strong"><div class="auth-intro__seal"><img src="/assets/logo_white.svg" alt="" /></div><p class="eyebrow">PKUPHYSU · ACCOUNT</p><h1>回来以后，<em>继续思考。</em></h1><p>登录物院学生会的开放空间，参与讨论、查看归档，并在个人中心管理自己的档案。</p><div class="auth-intro__note"><span class="status-dot"></span><span>已连接后端认证服务 · Bearer Token</span></div></aside>
    <section class="auth-panel glass-panel glass-panel--strong" aria-labelledby="auth-title">
      <div class="auth-panel__heading"><div><p class="eyebrow">WELCOME BACK</p><h2 id="auth-title">{{ mode === "login" ? "登录账户" : "创建账户" }}</h2></div><a class="text-link" href="/">返回首页 <span aria-hidden="true">↗</span></a></div>
      <div class="auth-mode-tabs" role="tablist" aria-label="账户操作"><button class="auth-mode-tab" :class="{ active: mode === 'login' }" type="button" role="tab" :aria-selected="mode === 'login'" @click="mode = 'login'; setMessage('')">登录</button><button class="auth-mode-tab" :class="{ active: mode === 'register' }" type="button" role="tab" :aria-selected="mode === 'register'" @click="mode = 'register'; setMessage('')">注册</button></div>
      <template v-if="mode === 'login'">
        <div class="auth-provider-tabs" role="tablist" aria-label="登录方式"><button class="auth-provider-tab" :class="{ active: loginMethod === 'account' }" type="button" role="tab" :aria-selected="loginMethod === 'account'" @click="loginMethod = 'account'; setMessage('')">账户登录</button><button class="auth-provider-tab" :class="{ active: loginMethod === 'iaaa' }" type="button" role="tab" :aria-selected="loginMethod === 'iaaa'" @click="loginMethod = 'iaaa'; setMessage('')">IAAA 登录</button></div>
        <form v-if="loginMethod === 'account'" class="auth-form" @submit.prevent="submitAccountLogin"><label class="auth-field"><span>账户名或邮箱</span><input v-model="account" type="text" autocomplete="username" placeholder="输入账户名或学号邮箱" required /></label><label class="auth-field"><span>密码</span><input v-model="accountPassword" type="password" autocomplete="current-password" placeholder="输入密码" required /></label><button class="action-button auth-submit" type="submit" :disabled="busy">{{ busy ? "登录中……" : "登录" }} <span aria-hidden="true">↗</span></button></form>
        <form v-else class="auth-form" @submit.prevent="submitIaaaLogin"><label class="auth-field"><span>IAAA 账号</span><input v-model="iaaaAccount" type="text" autocomplete="username" placeholder="输入 IAAA 账号" required /></label><label class="auth-field"><span>IAAA 密码</span><input v-model="iaaaPassword" type="password" autocomplete="current-password" placeholder="输入 IAAA 密码" required /></label><button class="action-button auth-submit" type="submit" :disabled="busy">{{ busy ? "验证中……" : "通过 IAAA 登录" }} <span aria-hidden="true">↗</span></button></form>
        <div class="auth-demo"><strong>认证说明</strong><span>账户登录使用后端账号密码接口</span><span>IAAA 凭据由后端转发，生产环境使用 HTTPS 保护传输</span><small>如后端未启动，页面会显示连接错误；不会再使用本地演示账户。</small></div>
      </template>
      <form v-else class="auth-form" @submit.prevent="submitRegister"><label class="auth-field"><span>账户名</span><input v-model="registerUsername" type="text" autocomplete="username" placeholder="设置一个账户名" minlength="1" maxlength="50" required /></label><label class="auth-field"><span>密码</span><input v-model="registerPassword" type="password" autocomplete="new-password" placeholder="至少 6 位字符" minlength="6" required /></label><label class="auth-field"><span>学号邮箱</span><input v-model="registerEmail" type="email" autocomplete="email" placeholder="学号@stu.pku.edu.cn" required /></label><div class="auth-code-row"><label class="auth-field"><span>邮箱验证码</span><input v-model="registerCode" type="text" inputmode="numeric" placeholder="输入验证码" :required="codeSent" /></label><button class="auth-code-button" type="button" @click="sendCode">{{ codeSent ? "重新发送" : "获取验证码" }}</button></div><p v-if="codeSent" class="auth-code-hint">验证码已发送，请在有效期内完成注册。</p><button class="action-button auth-submit" type="submit" :disabled="busy">{{ busy ? "注册中……" : "完成注册" }} <span aria-hidden="true">↗</span></button></form>
      <p v-if="message" class="auth-message" :class="`auth-message--${messageTone}`" role="status" aria-live="polite">{{ message }}</p>
    </section>
  </div>
</template>
