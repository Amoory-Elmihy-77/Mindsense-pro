import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Eye,
  Flag,
  HeartHandshake,
  MessageCircle,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import useCommunityStore from "../store/useCommunityStore";
import "../styles/community.css";

const tabs = [
  ["feed", "Feed"],
  ["circles", "Circles"],
  ["checkin", "Check-in"],
  ["challenges", "Challenges"],
  ["rooms", "Rooms"],
  ["sessions", "Sessions"],
  ["buddies", "Buddies"],
  ["leaderboard", "Leaderboard"],
  ["notifications", "Notifications"],
  ["moderation", "Moderation"],
];

const postTypes = ["reflection", "achievement", "progress", "challenge_update", "encouragement", "question"];
const moods = ["happy", "neutral", "sad", "angry", "anxious", "tired", "focused"];

function Card({ children, className = "" }) {
  return <section className={`glass-panel community-card ${className}`}>{children}</section>;
}

function EmptyState({ title, body }) {
  return (
    <div className="community-empty">
      <Sparkles size={24} />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:5020"}${path}`;
};

function getAuthorImage(item) {
  if (item?.visibility === "anonymous" || item?.displayAuthor?.mode === "anonymous") return null;
  return getImageUrl(item?.displayAuthor?.profileImage || item?.author?.profileImage);
}

function Avatar({ name = "MS", image, small = false }) {
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className={`community-avatar ${small ? "small" : ""}`}>
      {image ? <img src={image} alt={name} /> : initials}
    </div>
  );
}

function FeedComposer({ circles, onSubmit }) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("reflection");
  const [visibility, setVisibility] = useState("nickname");
  const [circle, setCircle] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!content.trim()) return;
    await onSubmit({ content, type, visibility, circle: circle || undefined });
    setContent("");
  };

  return (
    <Card className="composer-card">
      <form className="community-composer" onSubmit={submit}>
        <div className="composer-title">
          <div>
            <strong>Share with intention</strong>
            <p>Reflection, progress, questions, and encouragement only.</p>
          </div>
          <span>{content.length}/1200</span>
        </div>
        <div className="composer-row">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {postTypes.map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}
          </select>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            <option value="nickname">Nickname</option>
            <option value="anonymous">Anonymous</option>
            <option value="public">Public</option>
          </select>
          <select value={circle} onChange={(e) => setCircle(e.target.value)}>
            <option value="">Global</option>
            {circles.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What would be useful, honest, or encouraging to share today?"
          maxLength={1200}
        />
        <div className="composer-footer">
          <span>No diagnosis, medical advice, spam, or sensitive state exposure.</span>
          <button className="btn btn-primary" type="submit">Post</button>
        </div>
      </form>
    </Card>
  );
}

function PostDetail({ post, comments, commentDraft, setCommentDraft, store }) {
  if (!post) return null;

  return (
    <aside className="post-detail glass-panel">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Post Discussion</p>
          <h2>{post.circle?.name || "Global reflection"}</h2>
        </div>
        <button className="icon-button" onClick={store.closePost} aria-label="Close discussion"><X size={18} /></button>
      </div>

      <div className="detail-post">
        <div className="post-author">
          <Avatar name={post.displayAuthor?.name || "MS"} image={getAuthorImage(post)} />
          <div>
            <strong>{post.displayAuthor?.name || "Community Member"}</strong>
            <p>{post.type.replace("_", " ")} · {post.visibility}</p>
          </div>
        </div>
        <p>{post.content}</p>
      </div>

      <form
        className="detail-comment-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!commentDraft.trim()) return;
          await store.addComment(post._id, commentDraft);
          setCommentDraft("");
        }}
      >
        <textarea
          value={commentDraft}
          onChange={(event) => setCommentDraft(event.target.value)}
          placeholder="Add a supportive comment. Keep it kind, personal, and non-medical."
          maxLength={600}
        />
        <button className="btn btn-primary" type="submit"><Send size={16} /> Comment</button>
      </form>

      <div className="comments-panel">
        <div className="comments-title">
          <h3>All comments</h3>
          <span>{comments.length}</span>
        </div>
        {store.commentsLoading ? (
          <div className="comment-skeleton"><span /><span /><span /></div>
        ) : comments.length === 0 ? (
          <EmptyState title="No comments yet" body="Be the first to add support or a thoughtful reflection." />
        ) : (
          comments.map((item) => (
            <article className="comment-item" key={item._id}>
              <Avatar name={item.displayAuthor?.name || "MS"} image={getAuthorImage(item)} small />
              <div>
                <div className="comment-head">
                  <strong>{item.displayAuthor?.name || "Community Member"}</strong>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <p>{item.content}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}

function FeedTab({ feed, circles, store }) {
  const [commentDraft, setCommentDraft] = useState("");
  const selectedPost = feed.find((post) => post._id === store.selectedPostId);
  const selectedComments = selectedPost ? (store.commentsByPost[selectedPost._id] || []) : [];

  return (
    <div className={`feed-shell ${selectedPost ? "with-detail" : ""}`}>
      <div className="feed-column">
        <FeedComposer circles={circles} onSubmit={store.createPost} />
        {feed.length === 0 ? (
          <EmptyState title="No reflections yet" body="Start with one small update. Community grows from quiet consistency." />
        ) : feed.map((post) => (
          <Card key={post._id} className={`post-card ${store.selectedPostId === post._id ? "selected" : ""}`}>
            <div className="post-head">
              <div className="post-author">
                <Avatar name={post.displayAuthor?.name || "MS"} image={getAuthorImage(post)} />
                <div>
                  <strong>{post.displayAuthor?.name || "Community Member"}</strong>
                  <p>{post.circle?.name || "Global"} · {post.type.replace("_", " ")}</p>
                </div>
              </div>
              <span className="status-pill">{post.visibility}</span>
            </div>
            <p className="post-content">{post.content}</p>
            {post.status === "pending_review" && <div className="review-note">Pending moderation review before it appears publicly.</div>}
            <div className="post-meta">
              <span>{post.commentCount || 0} comments</span>
              <span>{post.shareCount || 0} shares</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="post-actions">
              <button onClick={() => store.reactToPost(post._id, "support")}><HeartHandshake size={16} /> Support {post.reactions?.length || 0}</button>
              <button onClick={() => store.openPost(post._id)}><Eye size={16} /> View discussion</button>
              <button onClick={() => store.savePost(post._id)}><CheckCircle2 size={16} /> Save</button>
              <button onClick={() => store.sharePost(post._id)}><Radio size={16} /> Share</button>
              <button onClick={() => store.report({ targetType: "post", targetId: post._id, reason: "other" })}><Flag size={16} /> Report</button>
            </div>
          </Card>
        ))}
      </div>

      <PostDetail
        post={selectedPost}
        comments={selectedComments}
        commentDraft={commentDraft}
        setCommentDraft={setCommentDraft}
        store={store}
      />
    </div>
  );
}

function CirclesTab({ circles, store }) {
  return (
    <div className="community-card-grid">
      {circles.map((circle) => (
        <Card key={circle._id}>
          <div className="circle-icon"><Users size={22} /></div>
          <h3>{circle.name}</h3>
          <p>{circle.description}</p>
          <div className="tag-row">{circle.tags?.map((tag) => <span key={tag}>#{tag}</span>)}</div>
          <div className="metric-row">
            <span>{circle.memberCount || 0} members</span>
            <span>{circle.stats?.posts || 0} posts</span>
          </div>
          <div className="split-actions">
            <button className="btn btn-primary" onClick={() => store.joinCircle(circle._id)}>Join</button>
            <button className="btn btn-secondary" onClick={() => store.leaveCircle(circle._id)}>Leave</button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CheckInTab({ circles, store }) {
  const [payload, setPayload] = useState({ mood: "neutral", energy: "medium", progress: 50, reflection: "", publishPost: false, visibility: "nickname", circle: "" });
  const update = (key, value) => setPayload((state) => ({ ...state, [key]: value }));

  return (
    <Card>
      <form className="checkin-form" onSubmit={async (event) => {
        event.preventDefault();
        await store.checkIn({ ...payload, circle: payload.circle || undefined });
        setPayload((state) => ({ ...state, reflection: "" }));
      }}>
        <h2>Daily Mood Check</h2>
        <div className="mood-grid">
          {moods.map((mood) => (
            <button type="button" key={mood} className={payload.mood === mood ? "selected" : ""} onClick={() => update("mood", mood)}>{mood}</button>
          ))}
        </div>
        <div className="composer-row">
          <select value={payload.energy} onChange={(e) => update("energy", e.target.value)}>
            <option value="low">Low energy</option>
            <option value="medium">Medium energy</option>
            <option value="high">High energy</option>
          </select>
          <select value={payload.circle} onChange={(e) => update("circle", e.target.value)}>
            <option value="">No circle</option>
            {circles.map((circle) => <option key={circle._id} value={circle._id}>{circle.name}</option>)}
          </select>
        </div>
        <label>Progress: {payload.progress}%</label>
        <input type="range" min="0" max="100" value={payload.progress} onChange={(e) => update("progress", Number(e.target.value))} />
        <textarea value={payload.reflection} onChange={(e) => update("reflection", e.target.value)} placeholder="What is one honest sentence about today?" />
        <label className="inline-check">
          <input type="checkbox" checked={payload.publishPost} onChange={(e) => update("publishPost", e.target.checked)} />
          Publish as a community reflection
        </label>
        <button className="btn btn-primary" type="submit">Complete Check-in</button>
      </form>
    </Card>
  );
}

function ChallengesTab({ challenges, myChallenges, store }) {
  const activeIds = new Set(myChallenges.map((item) => item.challenge?._id || item.challenge));
  return (
    <div className="community-card-grid">
      {challenges.map((challenge) => (
        <Card key={challenge._id}>
          <div className="circle-icon"><Trophy size={22} /></div>
          <h3>{challenge.title}</h3>
          <p>{challenge.description}</p>
          <div className="metric-row">
            <span>{challenge.type}</span>
            <span>{challenge.difficulty}</span>
            <span>+{challenge.xp} XP</span>
          </div>
          <ul className="task-list">
            {(challenge.tasks || []).slice(0, 3).map((task) => <li key={task._id}>{task.title}</li>)}
          </ul>
          <div className="split-actions">
            <button className="btn btn-secondary" onClick={() => store.joinChallenge(challenge._id)} disabled={activeIds.has(challenge._id)}>Join</button>
            <button className="btn btn-primary" onClick={() => store.completeChallenge(challenge._id)}>Complete</button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function RoomsTab({ rooms, store }) {
  const [message, setMessage] = useState({});
  return (
    <div className="community-card-grid">
      {rooms.map((room) => (
        <Card key={room._id}>
          <div className="circle-icon"><MessageCircle size={22} /></div>
          <h3>{room.name}</h3>
          <p>{room.description}</p>
          <div className="metric-row"><span>{room.type}</span><span>{room.activeCount || 0} active</span></div>
          <div className="prompt-box">{room.prompts?.[0] || "What would help you reflect right now?"}</div>
          <button className="btn btn-secondary" onClick={() => store.joinRoom(room._id)}>Join Room</button>
          <form className="comment-form" onSubmit={async (event) => {
            event.preventDefault();
            if (!message[room._id]?.trim()) return;
            await store.sendRoomMessage(room._id, message[room._id]);
            setMessage((state) => ({ ...state, [room._id]: "" }));
          }}>
            <input value={message[room._id] || ""} onChange={(e) => setMessage((state) => ({ ...state, [room._id]: e.target.value }))} placeholder="Short room reflection" />
            <button type="submit">Send</button>
          </form>
        </Card>
      ))}
    </div>
  );
}

function SessionsTab({ sessions, store, circles }) {
  const [title, setTitle] = useState("");
  const [circle, setCircle] = useState("");
  return (
    <div className="community-grid-main">
      <Card>
        <h2>Group Sessions</h2>
        <p className="muted">Create lightweight open sessions or professional guided sessions with a meeting link.</p>
        <div className="comment-form">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Session title" />
          <select value={circle} onChange={(e) => setCircle(e.target.value)}>
            <option value="">No circle</option>
            {circles.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
          <button onClick={() => {
            if (!title.trim()) return;
            store.createGroupSession({ title, circle: circle || undefined, type: "open" });
            setTitle("");
          }}>Create</button>
        </div>
      </Card>
      <div className="community-card-grid">
        {sessions.map((session) => (
          <Card key={session._id}>
            <div className="circle-icon"><Radio size={22} /></div>
            <h3>{session.title}</h3>
            <p>{session.description || "A shared community session for reflection and progress."}</p>
            <div className="metric-row">
              <span>{session.type}</span>
              <span>{session.participants?.length || 0}/{session.capacity}</span>
              <span>{new Date(session.startsAt).toLocaleString()}</span>
            </div>
            {session.meeting?.url && <a href={session.meeting.url} target="_blank" rel="noreferrer">Meeting link</a>}
            <button className="btn btn-primary" onClick={() => store.joinGroupSession(session._id)}>Join Session</button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BuddiesTab({ buddies, store }) {
  const [recipientId, setRecipientId] = useState("");
  const [goal, setGoal] = useState("");
  return (
    <div className="community-grid-main">
      <Card>
        <h2>Buddy System</h2>
        <p className="muted">Invite a trusted peer by user ID for shared goals and weekly encouragement.</p>
        <div className="comment-form">
          <input value={recipientId} onChange={(e) => setRecipientId(e.target.value)} placeholder="Recipient user ID" />
          <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Shared goal" />
          <button onClick={() => store.inviteBuddy(recipientId, goal ? [goal] : [])}>Invite</button>
        </div>
      </Card>
      {buddies.map((buddy) => (
        <Card key={buddy._id}>
          <h3>{buddy.requester?.name} + {buddy.recipient?.name}</h3>
          <p>Status: {buddy.status}</p>
          <div className="split-actions">
            {buddy.status === "pending" && <button className="btn btn-primary" onClick={() => store.acceptBuddy(buddy._id)}>Accept</button>}
            {buddy.status === "accepted" && <button className="btn btn-secondary" onClick={() => store.encourageBuddy(buddy._id, "Proud of your consistency today.")}>Encourage</button>}
          </div>
        </Card>
      ))}
    </div>
  );
}

function LeaderboardTab({ leaderboard }) {
  return (
    <Card>
      <h2>Community Reputation</h2>
      <div className="leader-list">
        {leaderboard.map((user, index) => (
          <div key={user._id} className="leader-row">
            <span>{index + 1}</span>
            <strong>{user.communityProfile?.nickname || user.name}</strong>
            <span>{user.communityProfile?.reputation?.contribution || 0} contribution</span>
            <span>{user.gamification?.xp || 0} XP</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NotificationsTab({ notifications, store }) {
  return (
    <div className="community-grid-main">
      {notifications.map((item) => (
        <Card key={item._id}>
          <div className="post-head">
            <Bell size={20} />
            <div><strong>{item.title}</strong><p>{item.body}</p></div>
            {!item.readAt && <button onClick={() => store.readNotification(item._id)}>Mark read</button>}
          </div>
        </Card>
      ))}
    </div>
  );
}

function ModerationTab({ queue, store, user }) {
  if (!["community_moderator", "admin"].includes(user?.role)) {
    return <EmptyState title="Moderator access only" body="Reports and audit actions are available to community moderators and admins." />;
  }
  return (
    <div className="community-grid-main">
      {(queue?.posts || []).map((post) => (
        <Card key={post._id}>
          <div className="post-head"><ShieldCheck size={20} /><strong>{post.author?.name}</strong><span className="status-pill">{post.moderation?.labels?.join(", ") || "review"}</span></div>
          <p className="post-content">{post.content}</p>
          <div className="split-actions">
            <button className="btn btn-primary" onClick={() => store.moderatePost(post._id, "approve")}>Approve</button>
            <button className="btn btn-secondary" onClick={() => store.moderatePost(post._id, "hide", "Hidden by moderator")}>Hide</button>
          </div>
        </Card>
      ))}
      {(!queue?.posts || queue.posts.length === 0) && <EmptyState title="Queue is clear" body="No posts are waiting for moderator review." />}
    </div>
  );
}

export default function Community() {
  const { user } = useAuthStore();
  const store = useCommunityStore();
  const {
    activeTab,
    overview,
    feed,
    circles,
    challenges,
    myChallenges,
    rooms,
    groupSessions,
    buddies,
    leaderboard,
    notifications,
    moderationQueue,
    realtimeStatus,
  } = store;

  useEffect(() => {
    store.connectRealtime();
    store.fetchOverview();
    store.fetchFeed();
    store.fetchCircles();
    store.fetchChallenges();
    store.fetchRooms();
    store.fetchGroupSessions();
    store.fetchBuddies();
    store.fetchLeaderboard();
    store.fetchNotifications();
    if (["community_moderator", "admin"].includes(user?.role)) store.fetchModerationQueue();
    return () => store.disconnectRealtime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const statCards = useMemo(() => [
    ["XP", overview?.xp || 0],
    ["Circles", circles.length],
    ["Challenges", myChallenges.length],
    ["Unread", notifications.filter((item) => !item.readAt).length],
  ], [overview, circles.length, myChallenges.length, notifications]);

  return (
    <div className="community-page animate-fade-in">
      <header className="community-hero">
        <div>
          <p className="eyebrow">MindSense Community</p>
          <h1>Grow Together.</h1>
          <p>Reflect Together. Progress Together.</p>
        </div>
        <div className={`realtime-pill ${realtimeStatus}`}>{realtimeStatus}</div>
      </header>

      <div className="community-stats">
        {statCards.map(([label, value]) => (
          <Card key={label} className="stat-card"><span>{label}</span><strong>{value}</strong></Card>
        ))}
      </div>

      <nav className="community-tabs">
        {tabs.map(([key, label]) => (
          <button key={key} className={activeTab === key ? "active" : ""} onClick={() => store.setTab(key)}>{label}</button>
        ))}
      </nav>

      {activeTab === "feed" && <FeedTab feed={feed} circles={circles} store={store} />}
      {activeTab === "circles" && <CirclesTab circles={circles} store={store} />}
      {activeTab === "checkin" && <CheckInTab circles={circles} store={store} />}
      {activeTab === "challenges" && <ChallengesTab challenges={challenges} myChallenges={myChallenges} store={store} />}
      {activeTab === "rooms" && <RoomsTab rooms={rooms} store={store} />}
      {activeTab === "sessions" && <SessionsTab sessions={groupSessions} store={store} circles={circles} />}
      {activeTab === "buddies" && <BuddiesTab buddies={buddies} store={store} />}
      {activeTab === "leaderboard" && <LeaderboardTab leaderboard={leaderboard} />}
      {activeTab === "notifications" && <NotificationsTab notifications={notifications} store={store} />}
      {activeTab === "moderation" && <ModerationTab queue={moderationQueue} store={store} user={user} />}
    </div>
  );
}
