import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowClockwise, Check, PencilSimple, UploadSimple, User } from '@phosphor-icons/react';
import Button from '../../components/Button';
import Mascot from '../../components/Mascot';
import UserAvatar from '../../components/UserAvatar';
import { site } from '../../config/env';
import { fetchMe, loadSession, patchMe, refreshAccess, type MeRec } from '../../lib/session';import { displayNameOf } from '../../lib/avatar';
import { useLiveTick } from '../../lib/live';

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return fallback;
}

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Profile: identity lives here. Display-name edit, Navii regenerate,
 * photo upload via POST /uploads (multipart, authed), revert to Navii.
 * Offline-safe everywhere with honest notices.
 */
export default function Profile() {
  const tick = useLiveTick();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [me, setMe] = useState<MeRec | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [nameError, setNameError] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchMe();
      if (cancelled) return;
      if (!data) setOffline(true);
      setMe(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const email = str(me?.email);
  const name = displayNameOf(
    {
      display_name: str(me?.display_name),
      name: str(me?.name),
      email,
    },
    'player',
  );
  const hasCustom = typeof me?.avatar_url === 'string' && str(me.avatar_url) !== '';

  async function saveName() {
    const value = draft.trim();
    if (value.length < 2) {
      setNameError('Use at least 2 characters so Melody can say it proudly.');
      return;
    }
    setNameError('');
    setSavingName(true);
    setNotice('');
    const prev = me;
    try {
      const updated = await patchMe({ display_name: value });
      if (!updated) {
        setMe(prev);
        setNotice('Could not save that name. Check your connection and try again.');
        return;
      }
      setMe({ ...(prev ?? {}), ...updated, display_name: value });
      setEditing(false);
      setNotice('Name saved. Melody approves.');
      window.dispatchEvent(new Event('app:profile-updated'));
    } finally {
      setSavingName(false);
    }
  }

  async function surpriseMe() {
    setAvatarBusy(true);
    setNotice('');
    try {
      const updated = await patchMe({ regenerate_avatar: true });
      if (!updated) {
        setNotice('Could not conjure a new Navii. Check your connection and try again.');
        return;
      }
      setMe({ ...(me ?? {}), ...updated });
      setNotice('A brand-new Navii hatched.');
      window.dispatchEvent(new Event('app:profile-updated'));
    } finally {
      setAvatarBusy(false);
    }
  }

  async function useNavii() {
    setAvatarBusy(true);
    setNotice('');
    try {
      const updated = await patchMe({ avatar_url: null });
      if (!updated) {
        setNotice('Could not switch back. Check your connection and try again.');
        return;
      }
      setMe({ ...(me ?? {}), ...updated, avatar_url: null });
      setNotice('Back to your Navii.');
      window.dispatchEvent(new Event('app:profile-updated'));
    } finally {
      setAvatarBusy(false);
    }
  }

  function pickFile() {
    setNotice('');
    fileRef.current?.click();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice('That file is not an image. Pick a JPG, PNG, or WebP photo.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setNotice('That photo is over 5MB. Pick a smaller one.');
      return;
    }
    setAvatarBusy(true);
    setUploadPct(0);
    setNotice('');
    try {
      const form = new FormData();
      form.append('file', file);
      // XMLHttpRequest for upload progress (fetch has no upload callbacks).
      // Manual Bearer is required here (authedFetch can't report progress),
      // with the same 401 → refreshAccess → retry contract as authedFetch.
      const postUpload = (retried: boolean) =>
        new Promise<string | null>((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${site.apiUrl}/uploads`);
          const applyAuth = () => {
            try {
              const token = loadSession()?.token;
              if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            } catch {
              /* session unreadable — try unauthenticated */
            }
          };
          applyAuth();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () => {
            if (xhr.status === 401 && !retried) {
              // Mirror authedFetch: one refresh → retry.
              void refreshAccess().then((renewed) => {
                if (!renewed) {
                  resolve(null);
                  return;
                }
                void postUpload(true).then(resolve);
              });
              return;
            }
            if (xhr.status < 200 || xhr.status >= 300) {
              resolve(null);
              return;
            }
            try {
              const data = JSON.parse(xhr.responseText) as Record<string, unknown>;
              const u =
                typeof data.url === 'string'
                  ? data.url
                  : typeof data.file_url === 'string'
                    ? data.file_url
                    : typeof data.secure_url === 'string'
                      ? data.secure_url
                      : null;
              resolve(u && u.trim() ? u.trim() : null);
            } catch {
              resolve(null);
            }
          };
          xhr.onerror = () => resolve(null);
          xhr.send(form);
        });
      const url = await postUpload(false);
      if (!url) {
        setNotice('Upload failed. Check your connection and try again — nothing was changed.');
        return;
      }
      const updated = await patchMe({ avatar_url: url });
      if (!updated) {
        setNotice('Photo uploaded, but the profile did not save it. Try again in a moment.');
        return;
      }
      setMe({ ...(me ?? {}), ...updated, avatar_url: url });
      setNotice('Photo updated. Looking sharp.');
      window.dispatchEvent(new Event('app:profile-updated'));
    } finally {
      setAvatarBusy(false);
      setUploadPct(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="wrap-narrow" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <p className="crumbs">
        <Link to="/app">Dashboard</Link> / <span>Profile</span>
      </p>
      <p className="kicker">Profile · your musical identity</p>
      <h1 style={{ marginTop: 6 }}>This is you.</h1>
      <p className="lede">Your name and face follow you to the leaderboard. Identity lives here — notification prefs live under Settings.</p>

      {loading ? (
        <div className="card" role="status" aria-label="Loading profile" style={{ marginTop: 18 }}>
          <p className="muted">Finding your reflection…</p>
        </div>
      ) : offline && !me ? (
        <div className="card" role="status" style={{ marginTop: 18 }}>
          <Mascot size={72} />
          <h2 style={{ marginTop: 10 }}>You are offline.</h2>
          <p className="muted">Your profile lives on the server. Reconnect and it will appear — nothing was faked.</p>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <Button to="/app" variant="light" size="sm">Back to dashboard</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <UserAvatar
                user={{
                  avatar_url: str(me?.avatar_url),
                  avatar_seed: str(me?.avatar_seed),
                  display_name: name,
                  email,
                }}
                size={120}
                alt={`${name}'s avatar`}
              />
              <div style={{ flex: 1, minWidth: 220 }}>
                {editing ? (
                  <div>
                    <label className="field" style={{ marginBottom: 8 }}>
                      <span>Display name</span>
                      <input
                        className="input"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={40}
                        autoFocus
                        aria-label="Display name"
                        aria-invalid={nameError ? true : undefined}
                      />
                    </label>
                    {nameError ? (
                      <p role="alert" className="field-error-text">{nameError}</p>
                    ) : null}
                    <div className="btn-row" style={{ marginTop: 8 }}>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => void saveName()} disabled={savingName}>
                        <Check size={15} weight="bold" aria-hidden="true" /> {savingName ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-light btn-sm"
                        onClick={() => {
                          setEditing(false);
                          setNameError('');
                        }}
                        disabled={savingName}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 style={{ margin: 0 }}>{name}</h2>
                    {email ? <p className="small muted" style={{ margin: '4px 0 0' }}>{email}</p> : null}
                    <div className="btn-row" style={{ marginTop: 10 }}>
                      <button
                        type="button"
                        className="btn btn-light btn-sm"
                        onClick={() => {
                          setDraft(name);
                          setEditing(true);
                        }}
                      >
                        <PencilSimple size={15} weight="bold" aria-hidden="true" /> Edit name
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={20} aria-hidden="true" /> Avatar
            </h3>
            <p className="small muted" style={{ marginTop: 0 }}>
              Custom photo wins when set, otherwise your Navii (grown from your account seed) shows up everywhere.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="visually-hidden"
              aria-label="Upload a profile photo"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => void surpriseMe()} disabled={avatarBusy}>
                <ArrowClockwise size={15} weight="bold" aria-hidden="true" /> {avatarBusy ? 'Working…' : 'Surprise me'}
              </button>
              <button type="button" className="btn btn-light btn-sm" onClick={pickFile} disabled={avatarBusy}>
                <UploadSimple size={15} weight="bold" aria-hidden="true" /> Upload photo
              </button>
              {hasCustom ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => void useNavii()} disabled={avatarBusy}>
                  Use my Navii
                </button>
              ) : null}
            </div>
            {uploadPct !== null ? (
              <div style={{ marginTop: 12 }}>
                <div className="bar" role="progressbar" aria-valuenow={uploadPct} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                  <span style={{ width: `${uploadPct}%` }} />
                </div>
                <p className="small muted" style={{ margin: '6px 0 0' }}>Uploading… {uploadPct}%</p>
              </div>
            ) : null}
            {notice ? (
              <p role="status" className="small" style={{ marginTop: 12, fontWeight: 700 }}>{notice}</p>
            ) : null}
          </div>

          <div className="btn-row" style={{ marginTop: 18 }}>
            <Button to="/app/settings" variant="light" size="sm">Notification & account settings</Button>
            <Button to="/app/premium" variant="sun" size="sm">Wormear Premium</Button>
          </div>
        </>
      )}
    </div>
  );
}
