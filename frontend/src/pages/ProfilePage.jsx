import { useEffect, useState } from "react";
import useForm from "../hooks/useForm";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";

function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function imageSource(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `http://${window.location.hostname}:5000${url}`;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { notify } = useToast();
  const profileForm = useForm({ name: user?.name || "", email: user?.email || "" });
  const passwordForm = useForm({ current_password: "", new_password: "", confirm_password: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.get("/me").then(({ data }) => {
      if (cancelled) return;
      profileForm.setValues({ name: data.name || "", email: data.email || "" });
      updateUser(data);
    }).catch((error) => {
      if (!cancelled) notify(error.message, "err");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("Choose an image file.", "err");
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("image", selectedFile);
    setUploading(true);
    try {
      const { data } = await api.put("/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser(data.user);
      setSelectedFile(null);
      setPreview("");
      notify("Profile photo updated.");
    } catch (error) {
      notify(error.message, "err");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileError("");
    setSavingProfile(true);
    try {
      const { data } = await api.put("/me", profileForm.values);
      updateUser(data.user);
      profileForm.setValues(data.user);
      notify("Profile updated.");
    } catch (error) {
      if (error.response?.status === 409) setProfileError(error.message);
      else setProfileError(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    if (passwordForm.values.new_password.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (passwordForm.values.new_password !== passwordForm.values.confirm_password) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await api.put("/me/password", passwordForm.values, { skipAuthRefresh: true });
      passwordForm.reset({ current_password: "", new_password: "", confirm_password: "" });
      notify("Password changed.");
    } catch (error) {
      if (error.message.toLowerCase().includes("current password")) setPasswordError(error.message);
      else setPasswordError(error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <div className="container loader" />;

  const avatar = preview || imageSource(user?.avatar_url);
  const created = user?.created_at
    ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(user.created_at))
    : "";

  return (
    <section className="container profile-page">
      <div className="page-head">
        <p className="eyebrow">Your account</p>
        <h1>Profile &amp; settings</h1>
        {created && <p className="profile-member">Member since {created}</p>}
      </div>

      <div className="profile-sections">
        <section className="profile-section">
          <div className="profile-section-heading">
            <p className="eyebrow">01 / Identity</p>
            <h2>Profile picture</h2>
          </div>
          <div className="profile-photo-row">
            {avatar ? (
              <img src={avatar} alt="Profile preview" className="profile-avatar" />
            ) : (
              <div className="profile-avatar profile-avatar-initials" aria-label={`${user?.name} initials`}>
                {initials(user?.name)}
              </div>
            )}
            <div className="profile-photo-controls">
              <label className="btn btn-ghost btn-sm profile-file-button">
                Change photo
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseImage} />
              </label>
              {selectedFile && <span className="kicker">{selectedFile.name}</span>}
              <button className="btn btn-sm" type="button" onClick={uploadAvatar} disabled={!selectedFile || uploading}>
                {uploading ? "Uploading..." : "Upload photo"}
              </button>
            </div>
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-heading">
            <p className="eyebrow">02 / Details</p>
            <h2>Edit profile</h2>
          </div>
          <form className="form profile-form" onSubmit={saveProfile}>
            <label>Name<input name="name" value={profileForm.values.name} onChange={profileForm.handleChange} required /></label>
            <label>Email<input name="email" type="email" value={profileForm.values.email} onChange={profileForm.handleChange} required /></label>
            {profileError && <p className="error" role="alert">{profileError}</p>}
            <button className="btn" disabled={savingProfile}>{savingProfile ? "Saving..." : "Save profile"}</button>
          </form>
        </section>

        <section className="profile-section">
          <div className="profile-section-heading">
            <p className="eyebrow">03 / Security</p>
            <h2>Change password</h2>
          </div>
          <form className="form profile-form" onSubmit={changePassword}>
            <label>Current password<input name="current_password" type="password" autoComplete="current-password" value={passwordForm.values.current_password} onChange={passwordForm.handleChange} required /></label>
            {passwordError.toLowerCase().includes("current password") && <p className="error" role="alert">{passwordError}</p>}
            <label>New password<input name="new_password" type="password" autoComplete="new-password" minLength="6" value={passwordForm.values.new_password} onChange={passwordForm.handleChange} required /></label>
            <label>Confirm new password<input name="confirm_password" type="password" autoComplete="new-password" value={passwordForm.values.confirm_password} onChange={passwordForm.handleChange} required /></label>
            {passwordError && !passwordError.toLowerCase().includes("current password") && <p className="error" role="alert">{passwordError}</p>}
            <button className="btn" disabled={savingPassword}>{savingPassword ? "Updating..." : "Update password"}</button>
          </form>
        </section>
      </div>
    </section>
  );
}