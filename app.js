// Gestion du calendrier annuel de pointage
class CalendrierPointage {
    constructor() {
        this.year = 2025;
        this.data = this.loadFromStorage();
        this.currentEditCell = null;
        
        this.monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        
        this.daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        this.holidays = {
            2024: [
                { date: '2024-01-01', name: 'Jour de l\'an' },
                { date: '2024-04-01', name: 'Lundi de Pâques' },
                { date: '2024-05-01', name: 'Fête du travail' },
                { date: '2024-05-08', name: 'Victoire 1945' },
                { date: '2024-05-09', name: 'Ascension' },
                { date: '2024-05-20', name: 'Lundi de Pentecôte' },
                { date: '2024-07-14', name: 'Fête nationale' },
                { date: '2024-08-15', name: 'Assomption' },
                { date: '2024-11-01', name: 'Toussaint' },
                { date: '2024-11-11', name: 'Armistice 1918' },
                { date: '2024-12-25', name: 'Noël' }
            ],
            2025: [
                { date: '2025-01-01', name: 'Jour de l\'an' },
                { date: '2025-04-21', name: 'Lundi de Pâques' },
                { date: '2025-05-01', name: 'Fête du travail' },
                { date: '2025-05-08', name: 'Victoire 1945' },
                { date: '2025-05-29', name: 'Ascension' },
                { date: '2025-06-09', name: 'Lundi de Pentecôte' },
                { date: '2025-07-14', name: 'Fête nationale' },
                { date: '2025-08-15', name: 'Assomption' },
                { date: '2025-11-01', name: 'Toussaint' },
                { date: '2025-11-11', name: 'Armistice 1918' },
                { date: '2025-12-25', name: 'Noël' }
            ],
            2026: [
                { date: '2026-01-01', name: 'Jour de l\'an' },
                { date: '2026-04-06', name: 'Lundi de Pâques' },
                { date: '2026-05-01', name: 'Fête du travail' },
                { date: '2026-05-08', name: 'Victoire 1945' },
                { date: '2026-05-14', name: 'Ascension' },
                { date: '2026-05-25', name: 'Lundi de Pentecôte' },
                { date: '2026-07-14', name: 'Fête nationale' },
                { date: '2026-08-15', name: 'Assomption' },
                { date: '2026-11-01', name: 'Toussaint' },
                { date: '2026-11-11', name: 'Armistice 1918' },
                { date: '2026-12-25', name: 'Noël' }
            ]
        };
        
        // Couleurs par défaut des statuts
        this.defaultColors = {
            'WE': '#e6b3ff',
            'F': '#90ee90',
            'C': '#ffcccc',
            'RP': '#ffd700',
            'RQ': '#87ceeb',
            'VT': '#ffb366',
            'CET': '#d8bfd8',
            'MA': '#ffa07a',
            'Fo': '#98fb98',
            'G1': '#ffccff',
            'G2': '#cc99ff',
            'G3': '#9966ff'
        };
        
        this.statusColors = this.loadColors();
        
        this.initializeApp();
    }

    // Vérifier si année bissextile
    isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    // Initialiser l'application
    initializeApp() {
        // Mettre à jour la date du jour
        const today = new Date();
        document.getElementById('todayDate').valueAsDate = today;
        
        // Gérer le changement d'année
        document.getElementById('yearSelect').addEventListener('change', (e) => {
            this.year = parseInt(e.target.value);
            this.generateCalendar();
            this.updateStatistics();
            this.displayHolidays();
        });

        // Boutons
        document.getElementById('printBtn').addEventListener('click', () => window.print());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveToStorage());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetCalendar());
        
        // Modal
        this.setupModal();
        
        // Sauvegarder le nom de l'agent
        document.getElementById('agentName').addEventListener('change', () => this.saveToStorage());
        
        // Sauvegarder les compteurs soldés lors de la modification
        for (let i = 1; i <= 5; i++) {
            document.getElementById(`soldeType${i}`).addEventListener('change', () => {
                this.updateStatistics();
                this.saveToStorage();
            });
            document.getElementById(`soldeVal${i}`).addEventListener('change', () => {
                this.updateStatistics();
                this.saveToStorage();
            });
        }
        
        // Sauvegarder le compteur RRQ lors de la modification
        const dateRefInput = document.getElementById('rqDateReference');
        const dateRefDisplay = document.getElementById('rqDateReferenceDisplay');
        
        // Quand on clique sur l'affichage, ouvrir le calendrier
        dateRefDisplay.addEventListener('click', () => {
            dateRefInput.showPicker();
        });
        
        // Quand la date change dans le calendrier, mettre à jour l'affichage
        dateRefInput.addEventListener('change', () => {
            const isoDate = dateRefInput.value;
            if (isoDate) {
                const [year, month, day] = isoDate.split('-');
                dateRefDisplay.value = `${day}/${month}/${year}`;
            } else {
                dateRefDisplay.value = '';
            }
            this.updateStatistics();
            this.saveToStorage();
        });
        
        document.getElementById('rqCompteurReference').addEventListener('change', () => {
            this.updateStatistics();
            this.saveToStorage();
        });
        
        // Générer le calendrier et afficher les jours fériés
        this.generateCalendar();
        this.updateStatistics();
        this.displayHolidays();
        this.displayColorPickers();
    }

    // Configurer le modal
    setupModal() {
        const modal = document.getElementById('editModal');
        const closeBtn = document.querySelector('.close');
        const cancelBtn = document.getElementById('cancelEditBtn');
        const form = document.getElementById('editForm');

        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCell();
        });
    }

    // Générer le calendrier complet
    generateCalendar() {
        const tbody = document.getElementById('calendarBody');
        tbody.innerHTML = '';
        
        // Ajuster février si année bissextile
        this.daysInMonth[1] = this.isLeapYear(this.year) ? 29 : 28;
        
        for (let month = 0; month < 12; month++) {
            const days = this.daysInMonth[month];
            
            // Ligne des numéros de semaine
            const weekRow = document.createElement('tr');
            weekRow.className = 'week-header';
            
            // Cellule du nom du mois fusionnée sur 2 lignes (semaine + jours)
            const monthCell = document.createElement('td');
            monthCell.rowSpan = 2;
            monthCell.className = 'month-name';
            
            // Définir l'icône et les informations de saison
            let seasonIcon = '';
            let seasonInfo = '';
            let seasonClass = '';
            
            if (month === 11 || month === 0 || month === 1) {
                seasonIcon = '❄️';
                seasonClass = 'season-winter';
                if (month === 11) seasonInfo = '<br><small>🌨️ Début Hiver (21)</small>';
            } else if (month >= 2 && month <= 4) {
                seasonIcon = '🌸';
                seasonClass = 'season-spring';
                if (month === 2) seasonInfo = '<br><small>🌱 Début Printemps (20)</small>';
            } else if (month >= 5 && month <= 7) {
                seasonIcon = '☀️';
                seasonClass = 'season-summer';
                if (month === 5) seasonInfo = '<br><small>🌞 Début Été (21)</small>';
            } else {
                seasonIcon = '🍂';
                seasonClass = 'season-autumn';
                if (month === 8) seasonInfo = '<br><small>🍁 Début Automne (22)</small>';
            }
            
            monthCell.innerHTML = `${seasonIcon} ${this.monthNames[month]}${seasonInfo}`;
            monthCell.classList.add(seasonClass);
            
            weekRow.appendChild(monthCell);
            
            // Calculer et afficher les numéros de semaine fusionnés
            let currentDay = 1;
            while (currentDay <= 31) {
                if (currentDay > days) {
                    // Ne rien faire ici, on traitera les jours inexistants après la boucle
                    currentDay++;
                    continue;
                }
                
                const date = new Date(this.year, month, currentDay);
                const weekNum = this.getWeekNumber(date);
                const dayOfWeek = date.getDay();
                const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Dimanche = 7
                
                // Calculer combien de jours de cette semaine sont dans ce mois
                let daysInWeek = 0;
                let tempDay = currentDay;
                const currentWeekNum = weekNum;
                
                while (tempDay <= days && tempDay <= 31) {
                    const tempDate = new Date(this.year, month, tempDay);
                    const tempWeekNum = this.getWeekNumber(tempDate);
                    if (tempWeekNum === currentWeekNum) {
                        daysInWeek++;
                        tempDay++;
                    } else {
                        break;
                    }
                }
                
                // Créer la cellule fusionnée pour la semaine
                const weekCell = document.createElement('td');
                weekCell.colSpan = daysInWeek;
                weekCell.className = `week-cell week-${weekNum % 2 === 0 ? 'even' : 'odd'}`;
                weekCell.innerHTML = `S${weekNum}`;
                
                // Vérifier si la semaine est passée
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const lastDayOfWeek = new Date(this.year, month, currentDay + daysInWeek - 1);
                lastDayOfWeek.setHours(23, 59, 59, 999);
                
                if (lastDayOfWeek < today) {
                    weekCell.classList.add('week-past');
                }
                
                weekRow.appendChild(weekCell);
                
                currentDay += daysInWeek;
            }
            
            // Calculer combien de cellules vides restantes et les fusionner en une seule
            let totalDaysInWeekRow = 0;
            for (let i = 0; i < weekRow.children.length; i++) {
                if (weekRow.children[i].classList.contains('month-name')) continue;
                totalDaysInWeekRow += parseInt(weekRow.children[i].colSpan || 1);
            }
            
            // Si on a moins de 31 jours, ajouter UNE cellule vide fusionnée
            const emptyDays = 31 - totalDaysInWeekRow;
            if (emptyDays > 0) {
                const emptyWeekCell = document.createElement('td');
                emptyWeekCell.className = 'week-cell week-empty';
                emptyWeekCell.colSpan = emptyDays;
                weekRow.appendChild(emptyWeekCell);
            }
            
            tbody.appendChild(weekRow);
            
            // Ligne du mois avec les jours (pas de cellule de mois car fusionnée)
            const monthRow = document.createElement('tr');
            monthRow.className = 'month-row';
            
            // Ajouter les cellules de jours avec fusion pour les jours inexistants
            let day = 1;
            while (day <= 31) {
                const dayCell = document.createElement('td');
                
                if (day <= days) {
                    // Jour existant
                    dayCell.className = 'day-cell';
                    const dateKey = `${this.year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const status = this.data[dateKey] || this.getDefaultStatus(this.year, month, day);
                    
                    // Ajouter la classe de semaine pour l'alternance de couleurs
                    const date = new Date(this.year, month, day);
                    const weekNum = this.getWeekNumber(date);
                    const weekClass = weekNum % 2 === 0 ? 'week-even' : 'week-odd';
                    
                    dayCell.textContent = status;
                    dayCell.className = `day-cell status-${status} ${weekClass}`;
                    dayCell.dataset.date = dateKey;
                    
                    // Vérifier si c'est le jour actuel
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const cellDate = new Date(dateKey + 'T00:00:00');
                    if (cellDate.getTime() === today.getTime()) {
                        dayCell.classList.add('current-day');
                    }
                    
                    // Appliquer la couleur personnalisée
                    if (status && this.statusColors[status]) {
                        dayCell.style.background = this.statusColors[status];
                    }
                    
                    dayCell.addEventListener('click', () => this.openModal(dateKey));
                    monthRow.appendChild(dayCell);
                    day++;
                } else {
                    // Jours inexistants : calculer combien de jours consécutifs manquent
                    const emptyDaysCount = 31 - days;
                    dayCell.className = 'day-cell empty';
                    dayCell.colSpan = emptyDaysCount;
                    monthRow.appendChild(dayCell);
                    break; // Sortir de la boucle car on a fusionné tous les jours restants
                }
            }
            
            tbody.appendChild(monthRow);
        }
    }
    
    // Calculer le numéro de semaine ISO 8601
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    // Obtenir le statut par défaut basé sur le jour de la semaine
    getDefaultStatus(year, month, day) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Vérifier si c'est un jour férié
        const yearHolidays = this.holidays[year] || [];
        if (yearHolidays.some(h => h.date === dateKey)) {
            return 'F';
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            return 'WE';
        } else {
            return '';
        }
    }
    
    // Afficher les jours fériés dans le tableau latéral
    displayHolidays() {
        const tbody = document.getElementById('holidaysBody');
        const yearSpan = document.getElementById('holidaysYear');
        
        yearSpan.textContent = this.year;
        tbody.innerHTML = '';
        
        const yearHolidays = this.holidays[this.year] || [];
        
        yearHolidays.forEach(holiday => {
            const row = document.createElement('tr');
            const date = new Date(holiday.date + 'T00:00:00');
            const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            
            row.innerHTML = `
                <td>${dateStr}</td>
                <td>${holiday.name}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Afficher les sélecteurs de couleurs pour les statuts
    displayColorPickers() {
        const tbody = document.getElementById('colorsBody');
        tbody.innerHTML = '';
        
        const statuses = ['WE', 'F', 'C', 'RP', 'RQ', 'VT', 'CET', 'MA', 'Fo', 'G1', 'G2', 'G3'];
        
        statuses.forEach(status => {
            const row = document.createElement('tr');
            const color = this.statusColors[status];
            
            row.innerHTML = `
                <td>${status}</td>
                <td><input type="color" class="color-picker" data-status="${status}" value="${color}"></td>
            `;
            tbody.appendChild(row);
            
            // Ajouter l'événement de changement
            const colorInput = row.querySelector('.color-picker');
            colorInput.addEventListener('change', (e) => {
                this.statusColors[status] = e.target.value;
                this.saveColors();
                this.generateCalendar();
            });
        });
    }

    // Ouvrir le modal d'édition
    openModal(dateKey) {
        this.currentEditCell = dateKey;
        const modal = document.getElementById('editModal');
        const status = this.data[dateKey] || this.getDefaultStatus(
            parseInt(dateKey.split('-')[0]),
            parseInt(dateKey.split('-')[1]) - 1,
            parseInt(dateKey.split('-')[2])
        );
        
        document.getElementById('editDate').value = this.formatDateFr(dateKey);
        document.getElementById('editStatus').value = status;
        document.getElementById('nbDays').value = 1;
        
        modal.style.display = 'block';
    }

    // Fermer le modal
    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        this.currentEditCell = null;
    }

    // Sauvegarder la cellule modifiée
    saveCell() {
        const status = document.getElementById('editStatus').value;
        const nbDays = parseInt(document.getElementById('nbDays').value) || 1;
        
        if (this.currentEditCell) {
            const startDate = new Date(this.currentEditCell + 'T00:00:00');
            let daysApplied = 0;
            let currentDate = new Date(startDate);
            
            // Appliquer le statut sur N jours (en ignorant WE et F)
            while (daysApplied < nbDays) {
                const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                const defaultStatus = this.getDefaultStatus(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    currentDate.getDate()
                );
                
                // Ne pas écraser les WE et jours fériés
                if (defaultStatus !== 'WE' && defaultStatus !== 'F') {
                    if (status === '') {
                        delete this.data[dateKey];
                    } else {
                        this.data[dateKey] = status;
                    }
                    daysApplied++;
                }
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            this.saveToStorage();
            this.generateCalendar();
            this.updateStatistics();
            this.closeModal();
        }
    }

    // Formater la date en français
    formatDateFr(dateKey) {
        const date = new Date(dateKey + 'T00:00:00');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    }

    // Mettre à jour les statistiques
    updateStatistics() {
        let stats = {
            C: 0,
            RP: 0,
            RQ: 0,
            VT: 0,
            CET: 0,
            MA: 0,
            Fo: 0,
            G1: 0,
            G2: 0,
            G3: 0
        };

        // Récupérer la date et le compteur de référence
        const dateReferenceStr = document.getElementById('rqDateReference').value; // Format ISO direct
        const compteurReference = parseInt(document.getElementById('rqCompteurReference').value) || 1;
        const nonIncrementStatuses = ['WE', 'F', 'C', 'MA'];

        let rqCompteurActuel = compteurReference;
        let rqGeneresDepuisDebut = 0; // RQ générés depuis le début de l'année
        let rqGeneresDepuisRef = 0;   // RQ générés depuis la date de référence

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Compter les occurrences de chaque type
        for (let month = 0; month < 12; month++) {
            const days = this.daysInMonth[month];
            
            for (let day = 1; day <= days; day++) {
                const dateKey = `${this.year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const status = this.data[dateKey] || this.getDefaultStatus(this.year, month, day);
                
                if (stats.hasOwnProperty(status)) {
                    stats[status]++;
                }

                const currentDate = new Date(dateKey + 'T00:00:00');
                
                // Si une date de référence est définie
                if (dateReferenceStr) {
                    const dateReference = new Date(dateReferenceStr + 'T00:00:00');
                    
                    // Compter uniquement les jours après la date de référence et jusqu'à aujourd'hui
                    if (currentDate > dateReference && currentDate <= today) {
                        if (!nonIncrementStatuses.includes(status)) {
                            rqCompteurActuel++;
                            if (rqCompteurActuel > 24) {
                                rqCompteurActuel = 1;
                                rqGeneresDepuisRef++;
                            }
                        }
                    }
                    
                    // Calculer aussi les RQ générés depuis le début de l'année jusqu'à aujourd'hui
                    // en partant du compteur de référence
                    if (currentDate >= new Date(this.year, 0, 1) && currentDate <= today) {
                        if (currentDate <= dateReference) {
                            // Pour les jours avant ou à la date de référence, ne rien faire
                            // (le compteur de référence inclut déjà ces jours)
                        } else {
                            // Les jours après la date de référence sont déjà comptés dans rqGeneresDepuisRef
                        }
                    }
                }
            }
        }

        // Si pas de date de référence, calculer depuis le début de l'année
        if (!dateReferenceStr) {
            rqCompteurActuel = 1;
            for (let month = 0; month < 12; month++) {
                const days = this.daysInMonth[month];
                
                for (let day = 1; day <= days; day++) {
                    const dateKey = `${this.year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const status = this.data[dateKey] || this.getDefaultStatus(this.year, month, day);
                    const currentDate = new Date(dateKey + 'T00:00:00');
                    
                    if (currentDate <= today) {
                        if (!nonIncrementStatuses.includes(status)) {
                            rqCompteurActuel++;
                            if (rqCompteurActuel > 24) {
                                rqCompteurActuel = 1;
                                rqGeneresDepuisDebut++;
                            }
                        }
                    }
                }
            }
        }

        // Calculer le nombre de RQ générés sur l'année complète (jusqu'à aujourd'hui)
        let rqGeneresAnnee = 0;
        
        if (dateReferenceStr) {
            const dateReference = new Date(dateReferenceStr + 'T00:00:00');
            let compteurTemp = 1; // On commence toujours à 1 le 01/01
            
            // Compter depuis le début de l'année jusqu'à aujourd'hui
            for (let month = 0; month < 12; month++) {
                const days = this.daysInMonth[month];
                
                for (let day = 1; day <= days; day++) {
                    const dateKey = `${this.year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const currentDate = new Date(dateKey + 'T00:00:00');
                    
                    if (currentDate <= today) {
                        const status = this.data[dateKey] || this.getDefaultStatus(this.year, month, day);
                        
                        if (currentDate < dateReference) {
                            // Avant la date de référence : simuler l'incrémentation
                            if (!nonIncrementStatuses.includes(status)) {
                                compteurTemp++;
                                if (compteurTemp > 24) {
                                    compteurTemp = 1;
                                    rqGeneresAnnee++;
                                }
                            }
                        } else if (currentDate.getTime() === dateReference.getTime()) {
                            // À la date de référence : ajuster le compteur pour correspondre au compteur de référence
                            // Si le compteur simulé ne correspond pas, c'est qu'il y a un décalage
                            // On doit synchroniser
                            compteurTemp = compteurReference;
                        } else {
                            // Après la date de référence : incrémenter normalement
                            if (!nonIncrementStatuses.includes(status)) {
                                compteurTemp++;
                                if (compteurTemp > 24) {
                                    compteurTemp = 1;
                                    rqGeneresAnnee++;
                                }
                            }
                        }
                    }
                }
            }
        } else {
            rqGeneresAnnee = rqGeneresDepuisDebut;
        }

        // Mettre à jour l'affichage de génération RQ
        // Si on est à la date de référence ou avant, afficher le compteur de référence
        if (dateReferenceStr) {
            const dateReference = new Date(dateReferenceStr + 'T00:00:00');
            if (today.getTime() === dateReference.getTime()) {
                // Si on est exactement à la date de référence, afficher le compteur de référence
                document.getElementById('rqCompteur').textContent = compteurReference;
            } else if (today < dateReference) {
                // Si on est avant la date de référence, on ne peut pas calculer
                document.getElementById('rqCompteur').textContent = '-';
            } else {
                // Si on est après la date de référence, afficher le compteur calculé
                document.getElementById('rqCompteur').textContent = rqCompteurActuel;
            }
        } else {
            document.getElementById('rqCompteur').textContent = rqCompteurActuel;
        }
        
        document.getElementById('rqGeneres').textContent = rqGeneresAnnee;
        
        // Projection : calculer combien de RQ seraient générés sur une année complète
        const currentYear = this.year;
        
        if (currentYear === today.getFullYear()) {
            const currentMonth = today.getMonth();
            const currentDay = today.getDate();
            
            let compteurProjection = rqCompteurActuel;
            let projectionRQ = rqGeneresAnnee;
            
            // Compter les jours restants et simuler la génération de RQ
            for (let month = 0; month < 12; month++) {
                const days = this.daysInMonth[month];
                for (let day = 1; day <= days; day++) {
                    // Ne projeter que pour les jours futurs
                    if (month > currentMonth || (month === currentMonth && day > currentDay)) {
                        const dateKey = `${this.year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const status = this.data[dateKey] || this.getDefaultStatus(this.year, month, day);
                        
                        // Simuler l'incrémentation du compteur pour les jours futurs
                        if (!nonIncrementStatuses.includes(status)) {
                            compteurProjection++;
                            if (compteurProjection > 24) {
                                compteurProjection = 1;
                                projectionRQ++;
                            }
                        }
                    }
                }
            }
            
            document.getElementById('rqProjection').textContent = projectionRQ;
        } else {
            // Pour les années autres que l'année en cours, afficher le total généré
            document.getElementById('rqProjection').textContent = rqGeneresAnnee;
        }

        // Récupérer les types sélectionnés dans SOLDÉ
        const selectedTypes = [];
        for (let i = 1; i <= 5; i++) {
            const type = document.getElementById(`soldeType${i}`).value;
            const soldeVal = parseInt(document.getElementById(`soldeVal${i}`).value) || 0;
            // Ne garder que les types non vides
            if (type !== '') {
                selectedTypes.push({ type, soldeVal });
            }
        }

        // Générer dynamiquement le contenu de PRIS
        const prisContent = document.getElementById('prisContent');
        prisContent.innerHTML = '';
        selectedTypes.forEach(item => {
            const prisVal = stats[item.type] || 0;
            const row = document.createElement('div');
            row.className = 'stat-row';
            row.innerHTML = `<span>${item.type}</span><span id="pris${item.type}">${prisVal}</span>`;
            prisContent.appendChild(row);
        });

        // Générer dynamiquement le contenu de RESTANT
        const restantContent = document.getElementById('restantContent');
        restantContent.innerHTML = '';
        selectedTypes.forEach(item => {
            const prisVal = stats[item.type] || 0;
            const restantVal = item.soldeVal - prisVal;
            const row = document.createElement('div');
            row.className = 'stat-row';
            
            const spanType = document.createElement('span');
            spanType.textContent = item.type;
            
            const spanVal = document.createElement('span');
            spanVal.id = `restant${item.type}`;
            spanVal.textContent = restantVal;
            
            // Appliquer les couleurs directement
            if (restantVal > 0) {
                spanVal.style.background = '#90ee90';
                spanVal.style.color = 'black';
            } else if (restantVal === 0) {
                spanVal.style.background = '#ffff00';
                spanVal.style.color = 'black';
            } else {
                spanVal.style.background = '#ff6b6b';
                spanVal.style.color = 'white';
            }
            
            row.appendChild(spanType);
            row.appendChild(spanVal);
            restantContent.appendChild(row);
        });
    }

    // Appliquer les couleurs aux statistiques
    applyStatColors(elementId, value) {
        const element = document.getElementById(elementId).parentElement;
        element.style.background = '';
        
        if (value > 0) {
            element.querySelector('span:last-child').style.background = '#90ee90';
        } else if (value === 0) {
            element.querySelector('span:last-child').style.background = '#ffff00';
        } else {
            element.querySelector('span:last-child').style.background = '#ff6b6b';
            element.querySelector('span:last-child').style.color = 'white';
        }
    }

    // Sauvegarder dans le localStorage
    saveToStorage() {
        localStorage.setItem('calendrierData', JSON.stringify(this.data));
        localStorage.setItem('agentName', document.getElementById('agentName').value);
        localStorage.setItem('rqDateReference', document.getElementById('rqDateReference').value);
        localStorage.setItem('rqCompteurReference', document.getElementById('rqCompteurReference').value);
        
        // Sauvegarder les types et valeurs SOLDÉ
        for (let i = 1; i <= 5; i++) {
            localStorage.setItem(`soldeType${i}`, document.getElementById(`soldeType${i}`).value);
            localStorage.setItem(`soldeVal${i}`, document.getElementById(`soldeVal${i}`).value);
        }
    }

    // Sauvegarder les couleurs dans le localStorage
    saveColors() {
        localStorage.setItem('statusColors', JSON.stringify(this.statusColors));
    }

    // Charger les couleurs depuis le localStorage
    loadColors() {
        const savedColors = localStorage.getItem('statusColors');
        if (savedColors) {
            return JSON.parse(savedColors);
        }
        return { ...this.defaultColors };
    }

    // Charger depuis le localStorage
    loadFromStorage() {
        const savedData = localStorage.getItem('calendrierData');
        const savedName = localStorage.getItem('agentName');
        const savedRqDate = localStorage.getItem('rqDateReference');
        const savedRqCompteur = localStorage.getItem('rqCompteurReference');
        
        // Charger le nom de l'agent
        if (savedName) {
            setTimeout(() => {
                document.getElementById('agentName').value = savedName;
            }, 100);
        }
        
        // Charger la date de référence RRQ
        if (savedRqDate) {
            setTimeout(() => {
                document.getElementById('rqDateReference').value = savedRqDate;
                // Convertir en format français pour l'affichage
                const [year, month, day] = savedRqDate.split('-');
                document.getElementById('rqDateReferenceDisplay').value = `${day}/${month}/${year}`;
            }, 100);
        }
        
        // Charger le compteur RRQ de référence
        if (savedRqCompteur) {
            setTimeout(() => {
                document.getElementById('rqCompteurReference').value = savedRqCompteur;
            }, 100);
        }
        
        // Charger les types et valeurs SOLDÉ
        const defaultTypes = ['C', 'RQ', 'RP', 'CET', 'VT'];
        const defaultValues = ['0', '0', '0', '0', '0'];
        
        setTimeout(() => {
            for (let i = 1; i <= 5; i++) {
                const savedType = localStorage.getItem(`soldeType${i}`);
                const savedVal = localStorage.getItem(`soldeVal${i}`);
                
                // Utiliser !== null pour permettre les valeurs vides ""
                document.getElementById(`soldeType${i}`).value = savedType !== null ? savedType : defaultTypes[i-1];
                document.getElementById(`soldeVal${i}`).value = savedVal !== null ? savedVal : defaultValues[i-1];
            }
            // Mettre à jour les statistiques après le chargement
            this.updateStatistics();
        }, 100);
        
        return savedData ? JSON.parse(savedData) : {};
    }

    // Réinitialiser le calendrier
    resetCalendar() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser tout le tableau ? Cette action est irréversible.')) {
            // Vider les données
            this.data = {};
            
            // Réinitialiser le compteur RRQ
            document.getElementById('rqCompteurReference').value = 1;
            
            // Réinitialiser les types et valeurs SOLDÉ aux valeurs par défaut
            const defaultTypes = ['C', 'RQ', 'RP', 'CET', 'VT'];
            const defaultValues = ['0', '0', '0', '0', '0'];
            
            for (let i = 1; i <= 5; i++) {
                document.getElementById(`soldeType${i}`).value = defaultTypes[i-1];
                document.getElementById(`soldeVal${i}`).value = defaultValues[i-1];
            }
            
            // Regénérer le calendrier et mettre à jour les statistiques
            this.generateCalendar();
            this.updateStatistics();
            
            // Sauvegarder l'état réinitialisé
            this.saveToStorage();
            
            alert('Le tableau a été réinitialisé avec succès !');
        }
    }
}

// Initialiser l'application au chargement
let calendrierPointage;
document.addEventListener('DOMContentLoaded', () => {
    calendrierPointage = new CalendrierPointage();
});
