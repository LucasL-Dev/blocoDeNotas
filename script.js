class NoteManager {
  constructor() {
    this.STORAGE_KEY = 'blocoDeNotas_content';
    this.HISTORY_KEY = 'blocoDeNotas_history';
    this.THEME_KEY = 'blocoDeNotas_theme';
    this.textarea = document.getElementById('blocoDeNotas');
    this.charCount = document.getElementById('charCount');
    this.saveBtn = document.getElementById('saveBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.themeBtn = document.getElementById('themeBtn');
    this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    this.historyBody = document.getElementById('historyBody');
    this.notification = document.getElementById('notification');
    
    this.init();
  }

  init() {
    this.loadNote();
    this.applyTheme();
    this.loadHistory();
    this.attachEventListeners();
  }

  loadNote() {
    try {
      const savedNote = localStorage.getItem(this.STORAGE_KEY);
      if (savedNote) {
        this.textarea.value = savedNote;
        this.updateCharCount();
      }
    } catch (error) {
      console.error('Erro ao carregar nota:', error);
      this.showNotification('Erro ao carregar nota', 'error');
    }
  }

  saveNote() {
    try {
      const currentValue = this.textarea.value;
      
      if (currentValue.length === 0) {
        this.showNotification('Nenhum conteúdo para salvar', 'info');
        return;
      }
      
      // Salva no localStorage (conteúdo atual)
      localStorage.setItem(this.STORAGE_KEY, currentValue);
      
      // Adiciona ao histórico
      this.addToHistory(currentValue);
      
      this.showNotification('Nota salva com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      this.showNotification('Erro ao salvar nota', 'error');
    }
  }

  addToHistory(content) {
    try {
      const history = this.getHistory();
      const timestamp = new Date();
      
      const entry = {
        date: timestamp.toLocaleDateString('pt-BR'),
        time: timestamp.toLocaleTimeString('pt-BR'),
        content: content,
        id: Date.now()
      };
      
      history.unshift(entry);
      
      // Manter apenas as últimas 50 entradas
      if (history.length > 50) {
        history.pop();
      }
      
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
      this.loadHistory();
    } catch (error) {
      console.error('Erro ao adicionar ao histórico:', error);
    }
  }

  getHistory() {
    try {
      const saved = localStorage.getItem(this.HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      return [];
    }
  }

  loadHistory() {
    const history = this.getHistory();
    
    if (history.length === 0) {
      this.historyBody.innerHTML = '<tr><td colspan="3" class="empty-message">Nenhuma nota no histórico</td></tr>';
      return;
    }
    
    this.historyBody.innerHTML = history.map(entry => {
      const preview = entry.content.substring(0, 60).replace(/\n/g, ' ');
      const displayPreview = preview.length >= 60 ? preview + '...' : preview;
      
      return `
        <tr>
          <td>${entry.date} ${entry.time}</td>
          <td class="history-preview" title="${entry.content}">${displayPreview}</td>
          <td class="history-actions">
            <button class="btn-xs btn-xs-restore" onclick="noteManager.restoreFromHistory(${entry.id})">Restaurar</button>
            <button class="btn-xs btn-xs-delete" onclick="noteManager.deleteFromHistory(${entry.id})">Deletar</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  restoreFromHistory(id) {
    const history = this.getHistory();
    const entry = history.find(e => e.id === id);
    
    if (entry) {
      this.textarea.value = entry.content;
      this.updateCharCount();
      this.showNotification('Nota restaurada. Clique em Salvar para confirmar!', 'info');
    }
  }

  deleteFromHistory(id) {
    if (confirm('Deseja deletar esta entrada do histórico?')) {
      let history = this.getHistory();
      history = history.filter(e => e.id !== id);
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
      this.loadHistory();
      this.showNotification('Entrada deletada', 'success');
    }
  }

  clearHistory() {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify([]));
      this.loadHistory();
      this.showNotification('Histórico limpo', 'success');
    }
  }

  updateCharCount() {
    const length = this.textarea.value.length;
    const wordCount = this.textarea.value.trim().split(/\s+/).filter(w => w.length > 0).length;
    this.charCount.textContent = `${length} caracteres • ${wordCount} palavras`;
  }

  clearNote() {
    if (this.textarea.value.length === 0) {
      this.showNotification('Nada para limpar', 'info');
      return;
    }

    if (confirm('Tem certeza que deseja limpar todas as notas?')) {
      this.textarea.value = '';
      this.updateCharCount();
      localStorage.setItem(this.STORAGE_KEY, '');
      this.showNotification('Notas limpas com sucesso', 'success');
    }
  }

  exportNote() {
    const content = this.textarea.value;
    if (content.length === 0) {
      this.showNotification('Nenhuma nota para exportar', 'info');
      return;
    }

    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const date = new Date().toISOString().split('T')[0];
    
    element.href = URL.createObjectURL(file);
    element.download = `notas_${date}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    this.showNotification('Nota exportada com sucesso', 'success');
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(this.THEME_KEY, newTheme);
    this.showNotification(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`, 'success');
  }

  applyTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  showNotification(message, type = 'info') {
    this.notification.textContent = message;
    this.notification.className = `notification notification-${type}`;
    this.notification.style.display = 'block';
    
    setTimeout(() => {
      this.notification.style.display = 'none';
    }, 3000);
  }

  attachEventListeners() {
    this.textarea.addEventListener('input', () => {
      this.updateCharCount();
    });

    this.saveBtn.addEventListener('click', () => this.saveNote());
    this.clearBtn.addEventListener('click', () => this.clearNote());
    this.exportBtn.addEventListener('click', () => this.exportNote());
    this.themeBtn.addEventListener('click', () => this.toggleTheme());
    this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

    const exitBtn = document.getElementById('exitBtn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        window.close();
      });
    }
  }
}

let noteManager;

document.addEventListener('DOMContentLoaded', () => {
  noteManager = new NoteManager();
});