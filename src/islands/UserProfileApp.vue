<script setup lang="ts">
import { onMounted, ref } from "vue";
import Icon from "../components/common/Icon.vue";
import { apiJson, ApiError, jsonBody, requestApi, readApiPayload } from "../lib/api";
import { hashPassword } from "../lib/password";
import { clearAuthSession, getAuthSession, getInitials, roleLabel, updateStoredUser } from "../lib/session";
import type { BackendUser } from "../lib/session";

const user = ref<BackendUser | null>(null);
const loading = ref(true);
const message = ref("");
const messageTone = ref<"error" | "success" | "info">("info");
const avatarVersion = ref(0);
const avatarFailed = ref(false);
const verificationSent = ref(false);
const verificationInput = ref("");
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const profileUsername = ref("");
const profileBio = ref("");

const setMessage = (text: string, tone: "error" | "success" | "info" = "info") => { message.value = text; messageTone.value = tone; };
const errorMessage = (error: unknown) => error instanceof ApiError ? error.message : "网络连接失败，请确认后端服务已经启动。";
const userEmail = () => user.value?.stuid ? `${user.value.stuid}@stu.pku.edu.cn` : "";

const loadUser = async () => {
  loading.value = true;
  if (!getAuthSession()?.token) { loading.value = false; return; }
  try {
    const result = await apiJson<BackendUser>("/user/me");
    user.value = result.data; profileUsername.value = result.data.username; profileBio.value = result.data.bio || ""; updateStoredUser(result.data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) clearAuthSession();
    setMessage(errorMessage(error), "error");
  } finally { loading.value = false; }
};

const onAvatarChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { setMessage("头像图片请控制在 5MB 以内。", "error"); input.value = ""; return; }
  try {
    const form = new FormData(); form.append("file", file);
    await readApiPayload(await requestApi("/user/avatar", { method: "POST", body: form }));
    avatarFailed.value = false; avatarVersion.value = Date.now(); setMessage("头像已更新。", "success");
  } catch (error) { setMessage(errorMessage(error), "error"); } finally { input.value = ""; }
};

const saveProfile = async () => {
  try {
    const result = await apiJson<{ username: string; bio: string }>("/user/me", { method: "PUT", body: jsonBody({ username: profileUsername.value.trim(), bio: profileBio.value }) });
    if (user.value) { user.value.username = result.data.username; user.value.bio = result.data.bio; updateStoredUser(user.value); }
    setMessage("个人资料已保存。", "success");
  } catch (error) { setMessage(errorMessage(error), "error"); }
};

const sendVerification = async () => {
  const email = userEmail();
  if (!email) { setMessage("当前账户没有可用的学号邮箱。", "error"); return; }
  try { await apiJson("/email/send", { method: "POST", body: jsonBody({ email }) }); verificationSent.value = true; setMessage("认证验证码已发送到你的邮箱。", "success"); }
  catch (error) { setMessage(errorMessage(error), "error"); }
};

const verifyEmail = async () => {
  const email = userEmail();
  if (!verificationSent.value || !verificationInput.value.trim()) { setMessage("请先获取并填写认证验证码。", "error"); return; }
  try {
    const result = await apiJson<{ token: string; username: string; userid: number }>("/email/verify", { method: "POST", body: jsonBody({ email, code: verificationInput.value.trim() }) });
    if (result.data?.token) {
      const session = getAuthSession();
      if (session) { session.user.verified = true; updateStoredUser(session.user); }
    }
    if (user.value) user.value.verified = true;
    verificationSent.value = false; verificationInput.value = ""; setMessage("邮箱认证完成。", "success");
  } catch (error) { setMessage(errorMessage(error), "error"); }
};

const changePassword = async () => {
  if (newPassword.value.length < 6) { setMessage("新密码至少需要 6 位字符。", "error"); return; }
  if (newPassword.value !== confirmPassword.value) { setMessage("两次输入的新密码不一致。", "error"); return; }
  try {
    await apiJson("/auth/change-password", { method: "POST", body: jsonBody({ oldPassword: await hashPassword(currentPassword.value), newPassword: await hashPassword(newPassword.value) }) });
    currentPassword.value = ""; newPassword.value = ""; confirmPassword.value = ""; setMessage("密码已更新。", "success");
  } catch (error) { setMessage(errorMessage(error), "error"); }
};

const logout = () => { clearAuthSession(); window.location.assign("/"); };
onMounted(loadUser);
</script>

<template>
  <div v-if="loading" class="profile-empty glass-panel glass-panel--strong"><span class="empty-state__mark">…</span><h1>正在读取个人档案</h1><p>请稍候。</p></div>
  <div v-else-if="!user" class="profile-empty glass-panel glass-panel--strong"><span class="empty-state__mark">?</span><h1>还没有登录</h1><p>{{ message || "登录后才能查看和管理个人档案。" }}</p><a class="action-button" href="/login">去登录 <span aria-hidden="true">↗</span></a></div>
  <div v-else class="profile-layout">
    <section class="profile-header glass-panel glass-panel--strong"><div class="profile-avatar" :class="{ 'profile-avatar--empty': avatarFailed || !user.id }"><img v-if="!avatarFailed" :src="`/user/avatar/${user.id}?v=${avatarVersion}`" alt="用户头像" @error="avatarFailed = true" /><span v-else>{{ getInitials(user.username) }}</span></div><div class="profile-header__copy"><p class="eyebrow">PERSONAL SPACE</p><h1>{{ user.username }}</h1><p>{{ userEmail() || "未绑定学生邮箱" }}</p><div class="profile-badges"><span class="profile-badge">{{ roleLabel(user.role) }}</span><span class="profile-badge" :class="{ 'profile-badge--verified': user.verified }"><Icon name="check" :size="13" />{{ user.verified ? "已认证" : "待认证" }}</span></div></div><button class="action-button action-button--quiet profile-logout" type="button" @click="logout">退出登录</button></section>
    <p v-if="message" class="profile-message" :class="`profile-message--${messageTone}`" role="status" aria-live="polite">{{ message }}</p>
    <div class="profile-grid">
      <section class="profile-card glass-panel"><div class="profile-card__header"><div><p class="eyebrow">PROFILE</p><h2>个人资料</h2></div><Icon name="image" :size="19" /></div><p class="profile-card__description">资料直接保存到后端用户记录，头像使用后端文件服务。</p><form class="profile-form" @submit.prevent="saveProfile"><label class="auth-field"><span>账户名</span><input v-model="profileUsername" type="text" maxlength="50" required /></label><label class="auth-field"><span>个人简介</span><textarea v-model="profileBio" maxlength="200" rows="3" placeholder="介绍一下自己"></textarea></label><button class="action-button action-button--quiet profile-small-button" type="submit">保存资料</button></form><label class="profile-upload"><span>更换头像</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" @change="onAvatarChange" /><small>PNG / JPG / WEBP / GIF · 最大 5MB</small></label></section>
      <section class="profile-card glass-panel"><div class="profile-card__header"><div><p class="eyebrow">SECURITY</p><h2>邮箱认证</h2></div><Icon name="check" :size="19" /></div><div class="profile-status" :class="{ 'profile-status--verified': user.verified }"><span></span><strong>{{ user.verified ? "邮箱已认证" : "邮箱尚未认证" }}</strong></div><p class="profile-card__description">认证邮箱：{{ userEmail() || "未绑定" }}</p><template v-if="!user.verified"><div class="profile-inline-form"><input v-model="verificationInput" type="text" inputmode="numeric" placeholder="输入验证码" :disabled="!verificationSent" /><button class="text-button" type="button" @click="sendVerification">{{ verificationSent ? "重新发送" : "发送验证码" }}</button></div><button class="action-button action-button--quiet profile-small-button" type="button" :disabled="!verificationSent" @click="verifyEmail">完成认证</button></template></section>
      <section class="profile-card glass-panel profile-card--password"><div class="profile-card__header"><div><p class="eyebrow">PASSWORD</p><h2>更换密码</h2></div><Icon name="settings" :size="19" /></div><form class="profile-form" @submit.prevent="changePassword"><label class="auth-field"><span>当前密码</span><input v-model="currentPassword" type="password" autocomplete="current-password" required /></label><div class="profile-form__row"><label class="auth-field"><span>新密码</span><input v-model="newPassword" type="password" autocomplete="new-password" minlength="6" required /></label><label class="auth-field"><span>确认新密码</span><input v-model="confirmPassword" type="password" autocomplete="new-password" minlength="6" required /></label></div><button class="action-button profile-small-button" type="submit">保存新密码</button></form></section>
      <section class="profile-card glass-panel profile-card--extensions"><div class="profile-card__header"><div><p class="eyebrow">EXTENSIONS</p><h2>后续可扩展</h2></div><Icon name="more" :size="19" /></div><div class="profile-extension-grid"><div class="profile-extension-item"><strong>我的文章</strong><span>后端已有接口</span></div><div class="profile-extension-item"><strong>我的评论</strong><span>后端已有接口</span></div><div class="profile-extension-item"><strong>收藏与关注</strong><span>论坛关联内容</span></div><div class="profile-extension-item"><strong>通知中心</strong><span>待接入消息模型</span></div></div></section>
    </div>
  </div>
</template>
