try { const theme = localStorage.getItem('portfolio-theme'); if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme; } catch {}
