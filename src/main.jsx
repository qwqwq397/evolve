import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlarmClock,
  BellRing,
  CalendarClock,
  Check,
  Circle,
  Clock3,
  ListChecks,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'todo-reminder-items';

const initialTodos = [
  {
    id: crypto.randomUUID(),
    title: '整理今天的任务',
    note: '把最重要的三件事放在上午完成。',
    dueAt: new Date(Date.now() + 1000 * 60 * 45).toISOString().slice(0, 16),
    priority: 'high',
    done: false,
    notified: false,
  },
  {
    id: crypto.randomUUID(),
    title: '喝水休息',
    note: '离开屏幕活动一下。',
    dueAt: new Date(Date.now() + 1000 * 60 * 120).toISOString().slice(0, 16),
    priority: 'medium',
    done: false,
    notified: false,
  },
];

function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialTodos;
  } catch {
    return initialTodos;
  }
}

function formatDue(dueAt) {
  if (!dueAt) return '未设置提醒';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dueAt));
}

function getStatus(todo) {
  if (todo.done) return 'done';
  if (!todo.dueAt) return 'open';
  const diff = new Date(todo.dueAt).getTime() - Date.now();
  if (diff < 0) return 'overdue';
  if (diff < 1000 * 60 * 60) return 'soon';
  return 'open';
}

function App() {
  const [todos, setTodos] = useState(loadTodos);
  const [filter, setFilter] = useState('active');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({
    title: '',
    note: '',
    dueAt: '',
    priority: 'medium',
  });
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported',
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTodos((current) =>
        current.map((todo) => {
          const due = todo.dueAt && new Date(todo.dueAt).getTime() <= Date.now();
          if (!todo.done && !todo.notified && due) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('待办提醒', {
                body: todo.title,
              });
            }
            return { ...todo, notified: true };
          }
          return todo;
        }),
      );
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const active = todos.filter((todo) => !todo.done).length;
    const overdue = todos.filter((todo) => getStatus(todo) === 'overdue').length;
    const done = todos.length - active;
    return { active, overdue, done };
  }, [todos]);

  const visibleTodos = useMemo(() => {
    return todos
      .filter((todo) => {
        if (filter === 'active') return !todo.done;
        if (filter === 'done') return todo.done;
        if (filter === 'overdue') return getStatus(todo) === 'overdue';
        return true;
      })
      .filter((todo) => {
        const keyword = query.trim().toLowerCase();
        if (!keyword) return true;
        return `${todo.title} ${todo.note}`.toLowerCase().includes(keyword);
      })
      .sort((a, b) => {
        if (a.done !== b.done) return Number(a.done) - Number(b.done);
        if (!a.dueAt) return 1;
        if (!b.dueAt) return -1;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      });
  }, [todos, filter, query]);

  function addTodo(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setTodos((current) => [
      {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        note: form.note.trim(),
        dueAt: form.dueAt,
        priority: form.priority,
        done: false,
        notified: false,
      },
      ...current,
    ]);
    setForm({ title: '', note: '', dueAt: '', priority: 'medium' });
  }

  async function requestNotification() {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  function toggleTodo(id) {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done, notified: todo.done ? false : todo.notified } : todo,
      ),
    );
  }

  function deleteTodo(id) {
    setTodos((current) => current.filter((todo) => todo.id !== id));
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Todo Reminder</p>
            <h1>待办事项提醒</h1>
          </div>
          <button className="notify-button" onClick={requestNotification} disabled={permission === 'granted'}>
            <BellRing size={18} />
            {permission === 'granted' ? '提醒已开启' : '开启桌面提醒'}
          </button>
        </header>

        <section className="summary-grid" aria-label="任务概览">
          <div className="summary-item">
            <ListChecks size={20} />
            <span>{stats.active}</span>
            <p>进行中</p>
          </div>
          <div className="summary-item danger">
            <AlarmClock size={20} />
            <span>{stats.overdue}</span>
            <p>已逾期</p>
          </div>
          <div className="summary-item success">
            <Check size={20} />
            <span>{stats.done}</span>
            <p>已完成</p>
          </div>
        </section>

        <form className="composer" onSubmit={addTodo}>
          <label>
            <span>事项</span>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="例如：18:00 前提交周报"
            />
          </label>
          <label>
            <span>提醒时间</span>
            <input
              type="datetime-local"
              value={form.dueAt}
              onChange={(event) => setForm({ ...form, dueAt: event.target.value })}
            />
          </label>
          <label>
            <span>优先级</span>
            <select
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value })}
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </label>
          <label className="wide">
            <span>备注</span>
            <input
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              placeholder="补充地点、资料或下一步"
            />
          </label>
          <button className="add-button" type="submit">
            <Plus size={18} />
            添加
          </button>
        </form>

        <div className="controls">
          <div className="tabs" role="tablist" aria-label="筛选待办">
            {[
              ['active', '未完成'],
              ['all', '全部'],
              ['overdue', '逾期'],
              ['done', '完成'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? 'active' : ''}
                onClick={() => setFilter(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <label className="search">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索任务" />
          </label>
        </div>

        <section className="todo-list" aria-label="待办列表">
          {visibleTodos.length === 0 ? (
            <div className="empty-state">
              <CalendarClock size={34} />
              <p>这里暂时没有匹配的待办。</p>
            </div>
          ) : (
            visibleTodos.map((todo) => {
              const status = getStatus(todo);
              return (
                <article className={`todo-card ${status}`} key={todo.id}>
                  <button className="check-button" onClick={() => toggleTodo(todo.id)} aria-label="切换完成状态">
                    {todo.done ? <Check size={19} /> : <Circle size={19} />}
                  </button>
                  <div className="todo-content">
                    <div className="todo-title-row">
                      <h2>{todo.title}</h2>
                      <span className={`priority ${todo.priority}`}>
                        {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                    {todo.note && <p>{todo.note}</p>}
                    <div className="meta">
                      <Clock3 size={16} />
                      <span>{formatDue(todo.dueAt)}</span>
                      {status === 'overdue' && <strong>已逾期</strong>}
                      {status === 'soon' && <strong>即将到期</strong>}
                    </div>
                  </div>
                  <button className="icon-button" onClick={() => deleteTodo(todo.id)} aria-label="删除任务">
                    <Trash2 size={18} />
                  </button>
                </article>
              );
            })
          )}
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
