/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {GoogleGenAI, Type} from '@google/genai';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { marked } from 'marked';


// --- Interfaces ---
interface Flashcard {
  term: string;
  definition: string;
}

interface SolutionStep {
    stepTitle: string;
    explanation: string;
    calculation?: string;
}

interface Solution {
    title: string;
    steps: SolutionStep[];
    finalAnswer: string;
}

interface QuizQuestion {
  question: string;
  answer: string;
}

enum QuestionType {
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
    FILL_IN_BLANK = 'FILL_IN_BLANK',
    OPEN_ENDED = 'OPEN_ENDED',
}

interface MistoQuestion {
  question: string;
  type: QuestionType;
  answer: string;
  options?: string[];
}

interface HistoryItem {
    id: string;
    mode: 'Aprender' | 'Combinar' | 'Misto' | 'Cartões' | 'Aprendizagem Guiada';
    topic: string;
    score: string;
    date: string; // ISO string for precision
    details?: {
        totalTime: number;
        timePerQuestion: number[];
    }
}

interface SavedSolution extends Solution {
    id: string;
    date: string;
    markdownContent?: string;
}

interface SavedFlashcardSet {
    id: string;
    name: string;
    cards: Flashcard[];
}

type SavedExerciseData = QuizQuestion[] | Flashcard[] | MistoQuestion[];

interface SavedExercise {
    id: string;
    name: string;
    mode: 'Aprender' | 'Combinar' | 'Misto';
    topic: string;
    data: SavedExerciseData;
}

interface User {
    name: string;
    email: string;
    avatar: string;
}

interface AnswerRecord {
  question: QuizQuestion | MistoQuestion;
  userAnswer: string;
  isCorrect: boolean;
  feedback: string;
  timeTaken: number;
}

interface SavedReport {
    id: string;
    date: string;
    topic: string;
    mode: 'Aprender' | 'Misto' | 'Combinar';
    content: string; // The full HTML of the report
}


// --- DOM Elements ---
const body = document.body;

// App Shell
const sidebar = document.getElementById('sidebar') as HTMLElement;
const navHome = document.getElementById('navHome') as HTMLAnchorElement;
const navItems = document.querySelectorAll('#sidebar .nav-item:not(#navHome)');

// Header
const userProfileBtn = document.getElementById('userProfileBtn') as HTMLButtonElement;
const loggedInIcon = document.querySelector('.logged-in-icon') as HTMLImageElement;
const loggedOutIcon = document.querySelector('.logged-out-icon') as HTMLElement;
const headerBackBtn = document.getElementById('headerBackBtn') as HTMLButtonElement;


// Main Content Views
const contentWrapper = document.getElementById('contentWrapper') as HTMLDivElement;
const homeView = document.getElementById('homeView') as HTMLDivElement;
const libraryView = document.getElementById('libraryView') as HTMLDivElement;
const studyViewContainer = document.getElementById('studyViewContainer') as HTMLDivElement;

// Individual Study Views
const learnView = document.getElementById('learnView') as HTMLDivElement;
const flashcardView = document.getElementById('flashcardView') as HTMLDivElement;
const guidedLearningView = document.getElementById('guidedLearningView') as HTMLDivElement;
const matchView = document.getElementById('matchView') as HTMLDivElement;
const mistoView = document.getElementById('mistoView') as HTMLDivElement;

// Home View Elements
const carousel = document.querySelector('.carousel') as HTMLDivElement;
const prevBtn = document.getElementById('prevBtn') as HTMLButtonElement;
const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;

// Learn View Elements
const learnSetup = document.getElementById('learnSetup') as HTMLDivElement;
const learnTopicInput = document.getElementById('learnTopicInput') as HTMLTextAreaElement;
const startLearnBtn = document.getElementById('startLearnBtn') as HTMLButtonElement;
const learnMessage = document.getElementById('learnMessage') as HTMLDivElement;
const learnQuiz = document.getElementById('learnQuiz') as HTMLDivElement;
const learnTimer = document.getElementById('learnTimer') as HTMLDivElement;
const learnProgress = document.getElementById('learnProgress') as HTMLDivElement;
const questionText = document.getElementById('questionText') as HTMLParagraphElement;
const learnAnswerInput = document.getElementById('learnAnswerInput') as HTMLTextAreaElement;
const submitLearnAnswerBtn = document.getElementById('submitLearnAnswerBtn') as HTMLButtonElement;
const learnFeedback = document.getElementById('learnFeedback') as HTMLDivElement;
const learnResults = document.getElementById('learnResults') as HTMLDivElement;
const learnReportContainer = document.getElementById('learnReportContainer') as HTMLDivElement;
const saveLearnReportBtn = document.getElementById('saveLearnReportBtn') as HTMLButtonElement;
const saveLearnExerciseBtn = document.getElementById('saveLearnExerciseBtn') as HTMLButtonElement;
const playLearnAgainBtn = document.getElementById('playLearnAgainBtn') as HTMLButtonElement;
const newLearnQuizBtn = document.getElementById('newLearnQuizBtn') as HTMLButtonElement;
const learnQuizNav = document.getElementById('learnQuizNav') as HTMLDivElement;
const learnPrevBtn = document.getElementById('learnPrevBtn') as HTMLButtonElement;
const learnNextBtn = document.getElementById('learnNextBtn') as HTMLButtonElement;


// Flashcard View Elements
const topicInput = document.getElementById('topicInput') as HTMLTextAreaElement;
const generateButton = document.getElementById('generateButton') as HTMLButtonElement;
const viewGeneratedCardsBtn = document.getElementById('viewGeneratedCardsBtn') as HTMLButtonElement;
const saveFlashcardsBtn = document.getElementById('saveFlashcardsBtn') as HTMLButtonElement;
const flashcardsContainer = document.getElementById('flashcardsContainer') as HTMLDivElement;
const errorMessage = document.getElementById('errorMessage') as HTMLDivElement;

// Guided Learning View Elements
const problemInput = document.getElementById('problemInput') as HTMLTextAreaElement;
const solveButton = document.getElementById('solveButton') as HTMLButtonElement;
const saveSolutionBtn = document.getElementById('saveSolutionBtn') as HTMLButtonElement;
const solutionContainer = document.getElementById('solutionContainer') as HTMLDivElement;
const solutionMessage = document.getElementById('solutionMessage') as HTMLDivElement;
const guidedFileInput = document.getElementById('guidedFileInput') as HTMLInputElement;
const guidedFileBtn = document.getElementById('guidedFileBtn') as HTMLButtonElement;
const guidedCameraBtn = document.getElementById('guidedCameraBtn') as HTMLButtonElement;
const filePreviewArea = document.getElementById('filePreviewArea') as HTMLDivElement;
const fileNamePreview = document.getElementById('fileNamePreview') as HTMLSpanElement;
const removeFileBtn = document.getElementById('removeFileBtn') as HTMLButtonElement;
const cameraPreviewArea = document.getElementById('cameraPreviewArea') as HTMLDivElement;
const cameraVideo = document.getElementById('cameraVideo') as HTMLVideoElement;
const cameraCanvas = document.getElementById('cameraCanvas') as HTMLCanvasElement;
const captureBtn = document.getElementById('captureBtn') as HTMLButtonElement;
const closeCameraBtn = document.getElementById('closeCameraBtn') as HTMLButtonElement;


// Match Game View Elements
const matchSetup = document.getElementById('matchSetup') as HTMLDivElement;
const matchTopicInput = document.getElementById('matchTopicInput') as HTMLTextAreaElement;
const startGameBtn = document.getElementById('startGameBtn') as HTMLButtonElement;
const matchMessage = document.getElementById('matchMessage') as HTMLDivElement;
const matchBoard = document.getElementById('matchBoard') as HTMLDivElement;
const timerEl = document.getElementById('timer') as HTMLDivElement;
const scoreEl = document.getElementById('score') as HTMLDivElement;
const termsContainer = document.getElementById('termsContainer') as HTMLDivElement;
const definitionsContainer = document.getElementById('definitionsContainer') as HTMLDivElement;
const matchResults = document.getElementById('matchResults') as HTMLDivElement;
const matchReportContainer = document.getElementById('matchReportContainer') as HTMLDivElement;
const saveMatchReportBtn = document.getElementById('saveMatchReportBtn') as HTMLButtonElement;
const saveMatchExerciseBtn = document.getElementById('saveMatchExerciseBtn') as HTMLButtonElement;
const playAgainBtn = document.getElementById('playAgainBtn') as HTMLButtonElement;
const newMatchGameBtn = document.getElementById('newMatchGameBtn') as HTMLButtonElement;

// Misto View Elements
const mistoSetup = document.getElementById('mistoSetup') as HTMLDivElement;
const mistoTopicInput = document.getElementById('mistoTopicInput') as HTMLTextAreaElement;
const startMistoBtn = document.getElementById('startMistoBtn') as HTMLButtonElement;
const mistoMessage = document.getElementById('mistoMessage') as HTMLDivElement;
const mistoQuiz = document.getElementById('mistoQuiz') as HTMLDivElement;
const mistoTimer = document.getElementById('mistoTimer') as HTMLDivElement;
const mistoProgress = document.getElementById('mistoProgress') as HTMLDivElement;
const mistoQuestionText = document.getElementById('mistoQuestionText') as HTMLParagraphElement;
const mistoAnswerOptions = document.getElementById('mistoAnswerOptions') as HTMLDivElement;
const submitMistoAnswerBtn = document.getElementById('submitMistoAnswerBtn') as HTMLButtonElement;
const mistoFeedback = document.getElementById('mistoFeedback') as HTMLDivElement;
const mistoResults = document.getElementById('mistoResults') as HTMLDivElement;
const mistoReportContainer = document.getElementById('mistoReportContainer') as HTMLDivElement;
const saveMistoReportBtn = document.getElementById('saveMistoReportBtn') as HTMLButtonElement;
const saveMistoExerciseBtn = document.getElementById('saveMistoExerciseBtn') as HTMLButtonElement;
const playMistoAgainBtn = document.getElementById('playMistoAgainBtn') as HTMLButtonElement;
const newMistoQuizBtn = document.getElementById('newMistoQuizBtn') as HTMLButtonElement;
const mistoQuizNav = document.getElementById('mistoQuizNav') as HTMLDivElement;
const mistoPrevBtn = document.getElementById('mistoPrevBtn') as HTMLButtonElement;
const mistoNextBtn = document.getElementById('mistoNextBtn') as HTMLButtonElement;

// Library View Elements
const libraryContent = document.getElementById('libraryContent') as HTMLDivElement;
const libraryTitle = document.getElementById('libraryTitle') as HTMLHeadingElement;
const historyTabContent = document.getElementById('historyTabContent') as HTMLDivElement;
const solutionsTabContent = document.getElementById('solutionsTabContent') as HTMLDivElement;
const cardsTabContent = document.getElementById('cardsTabContent') as HTMLDivElement;
const exercisesTabContent = document.getElementById('exercisesTabContent') as HTMLDivElement;
const reportsTabContent = document.getElementById('reportsTabContent') as HTMLDivElement;
const historyTable = document.getElementById('historyTable') as HTMLTableElement;


// Login Modal Elements
const loginModal = document.getElementById('loginModal') as HTMLDivElement;
const closeLoginModalBtn = document.getElementById('closeLoginModalBtn') as HTMLButtonElement;
const loginForm = document.getElementById('loginForm') as HTMLFormElement;
const loginEmailInput = document.getElementById('loginEmailInput') as HTMLInputElement;
const loginPasswordInput = document.getElementById('loginPasswordInput') as HTMLInputElement;
const loginError = document.getElementById('loginError') as HTMLDivElement;

// User Profile Modal Elements
const userProfileModal = document.getElementById('userProfileModal') as HTMLDivElement;
const closeUserProfileModalBtn = document.getElementById('closeUserProfileModalBtn') as HTMLButtonElement;
const loggedInUserView = document.getElementById('loggedInUserView') as HTMLDivElement;
const loggedOutUserView = document.getElementById('loggedOutUserView') as HTMLDivElement;
const userInfoAvatar = document.getElementById('userInfoAvatar') as HTMLImageElement;
const userInfoName = document.getElementById('userInfoName') as HTMLDivElement;
const userInfoEmail = document.getElementById('userInfoEmail') as HTMLDivElement;
const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;
const themeToggleBtn = document.getElementById('themeToggleBtn') as HTMLButtonElement;
const themeToggleIcon = document.getElementById('themeToggleIcon') as HTMLSpanElement;
const themeToggleText = document.getElementById('themeToggleText') as HTMLSpanElement;
const themeToggleBtnLoggedOut = document.getElementById('themeToggleBtnLoggedOut') as HTMLButtonElement;
const themeToggleIconLoggedOut = document.getElementById('themeToggleIconLoggedOut') as HTMLSpanElement;
const themeToggleTextLoggedOut = document.getElementById('themeToggleTextLoggedOut') as HTMLSpanElement;
const loginGoogleBtn = document.getElementById('loginGoogleBtn') as HTMLButtonElement;
const loginEmailBtn = document.getElementById('loginEmailBtn') as HTMLButtonElement;
const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;

// Settings Modal
const settingsModal = document.getElementById('settingsModal') as HTMLDivElement;
const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn') as HTMLButtonElement;
const settingsTabs = document.querySelectorAll<HTMLElement>('#settingsModal .modal-tab');
const settingsTabContents = document.querySelectorAll<HTMLElement>('#settingsModal .modal-tab-content');
// Profile Settings
const profileSettingsForm = document.getElementById('profileSettingsForm') as HTMLFormElement;
const settingsAvatarPreview = document.getElementById('settingsAvatarPreview') as HTMLImageElement;
const avatarUploadInput = document.getElementById('avatarUploadInput') as HTMLInputElement;
const uploadAvatarBtn = document.getElementById('uploadAvatarBtn') as HTMLButtonElement;
const removeAvatarBtn = document.getElementById('removeAvatarBtn') as HTMLButtonElement;
const settingsNameInput = document.getElementById('settingsNameInput') as HTMLInputElement;
const settingsEmailInput = document.getElementById('settingsEmailInput') as HTMLInputElement;
// Security Settings
const securitySettingsForm = document.getElementById('securitySettingsForm') as HTMLFormElement;
const currentPasswordInput = document.getElementById('currentPasswordInput') as HTMLInputElement;
const newPasswordInput = document.getElementById('newPasswordInput') as HTMLInputElement;
const confirmPasswordInput = document.getElementById('confirmPasswordInput') as HTMLInputElement;
// Account Settings
const deleteAccountBtn = document.getElementById('deleteAccountBtn') as HTMLButtonElement;


// Pause/Exit Modal Elements
const pauseExitModal = document.getElementById('pauseExitModal') as HTMLDivElement;
const closePauseExitModalBtn = document.getElementById('closePauseExitModalBtn') as HTMLButtonElement;
const giveUpBtn = document.getElementById('giveUpBtn') as HTMLButtonElement;
const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
const regenerateBtn = document.getElementById('regenerateBtn') as HTMLButtonElement;

// Resume Exercise Modal
const resumeExerciseModal = document.getElementById('resumeExerciseModal') as HTMLDivElement;
const closeResumeExerciseModalBtn = document.getElementById('closeResumeExerciseModalBtn') as HTMLButtonElement;
const resumeBtn = document.getElementById('resumeBtn') as HTMLButtonElement;
const regenerateFromPauseBtn = document.getElementById('regenerateFromPauseBtn') as HTMLButtonElement;
const giveUpFromPauseBtn = document.getElementById('giveUpFromPauseBtn') as HTMLButtonElement;

// Exercise Config Modal Elements
const exerciseConfigModal = document.getElementById('exerciseConfigModal') as HTMLDivElement;
const closeExerciseConfigModalBtn = document.getElementById('closeExerciseConfigModalBtn') as HTMLButtonElement;
const exerciseConfigForm = document.getElementById('exerciseConfigForm') as HTMLFormElement;
const configItemCountInput = document.getElementById('configItemCount') as HTMLInputElement;
const configTimeLimitInput = document.getElementById('configTimeLimit') as HTMLInputElement;

// Save Flashcards Modal Elements
const saveFlashcardsModal = document.getElementById('saveFlashcardsModal') as HTMLDivElement;
const closeSaveFlashcardsModalBtn = document.getElementById('closeSaveFlashcardsModalBtn') as HTMLButtonElement;
const saveFlashcardsForm = document.getElementById('saveFlashcardsForm') as HTMLFormElement;
const flashcardFolderNameInput = document.getElementById('flashcardFolderNameInput') as HTMLInputElement;
const selectableCardList = document.getElementById('selectableCardList') as HTMLDivElement;

// Save Exercise Modal Elements
const saveExerciseModal = document.getElementById('saveExerciseModal') as HTMLDivElement;
const closeSaveExerciseModalBtn = document.getElementById('closeSaveExerciseModalBtn') as HTMLButtonElement;
const saveExerciseForm = document.getElementById('saveExerciseForm') as HTMLFormElement;
const exerciseFolderNameInput = document.getElementById('exerciseFolderNameInput') as HTMLInputElement;

// Solution Detail Modal Elements
const solutionDetailModal = document.getElementById('solutionDetailModal') as HTMLDivElement;
const closeSolutionDetailModalBtn = document.getElementById('closeSolutionDetailModalBtn') as HTMLButtonElement;
const solutionDetailViewer = document.getElementById('solutionDetailViewer') as HTMLDivElement;
const solutionDetailContent = document.getElementById('solutionDetailContent') as HTMLDivElement;
const solutionDetailEditor = document.getElementById('solutionDetailEditor') as HTMLDivElement;
const actionDownloadFromViewer = document.getElementById('actionDownloadFromViewer') as HTMLButtonElement;
const downloadOptionsViewer = document.getElementById('downloadOptionsViewer') as HTMLDivElement;
const actionEditFromViewer = document.getElementById('actionEditFromViewer') as HTMLButtonElement;
const markdownEditorTabs = document.querySelectorAll('#solutionDetailEditor .tab-btn');
const markdownEditorArea = document.getElementById('markdownEditorArea') as HTMLDivElement;
const markdownPreviewArea = document.getElementById('markdownPreviewArea') as HTMLDivElement;
const markdownEditorTextarea = document.getElementById('markdownEditorTextarea') as HTMLTextAreaElement;
const cancelMarkdownEdit = document.getElementById('cancelMarkdownEdit') as HTMLButtonElement;
const saveMarkdownEdit = document.getElementById('saveMarkdownEdit') as HTMLButtonElement;

// Edit Card Set Modal
const editCardSetModal = document.getElementById('editCardSetModal') as HTMLDivElement;
const closeEditCardSetModalBtn = document.getElementById('closeEditCardSetModalBtn') as HTMLButtonElement;
const editCardSetForm = document.getElementById('editCardSetForm') as HTMLFormElement;
const editCardSetNameInput = document.getElementById('editCardSetNameInput') as HTMLInputElement;
const editCardSetList = document.getElementById('editCardSetList') as HTMLDivElement;
const addNewCardBtn = document.getElementById('addNewCardBtn') as HTMLButtonElement;

// Exercise Actions Modal
const exerciseActionsModal = document.getElementById('exerciseActionsModal') as HTMLDivElement;
const closeExerciseActionsModalBtn = document.getElementById('closeExerciseActionsModalBtn') as HTMLButtonElement;
const actionPlayAgain = document.getElementById('actionPlayAgain') as HTMLButtonElement;
const actionEditExercise = document.getElementById('actionEditExercise') as HTMLButtonElement;
const actionDeleteExercise = document.getElementById('actionDeleteExercise') as HTMLButtonElement;

// Edit Exercise Modal
const editExerciseModal = document.getElementById('editExerciseModal') as HTMLDivElement;
const closeEditExerciseModalBtn = document.getElementById('closeEditExerciseModalBtn') as HTMLButtonElement;
const editExerciseForm = document.getElementById('editExerciseForm') as HTMLFormElement;
const editExerciseNameInput = document.getElementById('editExerciseNameInput') as HTMLInputElement;
const editExerciseContent = document.getElementById('editExerciseContent') as HTMLDivElement;
const addNewExerciseItemBtn = document.getElementById('addNewExerciseItemBtn') as HTMLButtonElement;

// History Report Modal
const historyReportModal = document.getElementById('historyReportModal') as HTMLDivElement;
const closeHistoryReportModalBtn = document.getElementById('closeHistoryReportModalBtn') as HTMLButtonElement;
const historyReportContent = document.getElementById('historyReportContent') as HTMLDivElement;

// Report Viewer Modal
const reportViewerModal = document.getElementById('reportViewerModal') as HTMLDivElement;
const closeReportViewerModalBtn = document.getElementById('closeReportViewerModalBtn') as HTMLButtonElement;
const reportViewerContent = document.getElementById('reportViewerContent') as HTMLDivElement;

// Confirm Delete Modal
const confirmDeleteModal = document.getElementById('confirmDeleteModal') as HTMLDivElement;
const confirmDeleteTitle = document.getElementById('confirmDeleteTitle') as HTMLHeadingElement;
const confirmDeleteText = document.getElementById('confirmDeleteText') as HTMLParagraphElement;
const closeConfirmDeleteModalBtn = document.getElementById('closeConfirmDeleteModalBtn') as HTMLButtonElement;
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn') as HTMLButtonElement;
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn') as HTMLButtonElement;

// Solution Actions Modal
const solutionActionsModal = document.getElementById('solutionActionsModal') as HTMLDivElement;
const closeSolutionActionsModalBtn = document.getElementById('closeSolutionActionsModalBtn') as HTMLButtonElement;
const actionViewSolution = document.getElementById('actionViewSolution') as HTMLButtonElement;
const actionDownloadSolution = document.getElementById('actionDownloadSolution') as HTMLButtonElement;
const downloadOptionsSolution = document.getElementById('downloadOptionsSolution') as HTMLDivElement;
const actionDeleteSolution = document.getElementById('actionDeleteSolution') as HTMLButtonElement;

// Report Actions Modal
const reportActionsModal = document.getElementById('reportActionsModal') as HTMLDivElement;
const closeReportActionsModalBtn = document.getElementById('closeReportActionsModalBtn') as HTMLButtonElement;
const actionViewReport = document.getElementById('actionViewReport') as HTMLButtonElement;
const actionDownloadReport = document.getElementById('actionDownloadReport') as HTMLButtonElement;
const downloadOptionsReport = document.getElementById('downloadOptionsReport') as HTMLDivElement;
const actionDeleteReport = document.getElementById('actionDeleteReport') as HTMLButtonElement;

// Card Actions Modal
const cardActionsModal = document.getElementById('cardActionsModal') as HTMLDivElement;
const closeCardActionsModalBtn = document.getElementById('closeCardActionsModalBtn') as HTMLButtonElement;
const actionViewCards = document.getElementById('actionViewCards') as HTMLButtonElement;
const actionEditCards = document.getElementById('actionEditCards') as HTMLButtonElement;
const actionDeleteCards = document.getElementById('actionDeleteCards') as HTMLButtonElement;

// Card Viewer Modal
const cardViewerModal = document.getElementById('cardViewerModal') as HTMLDivElement;
const closeCardViewerModalBtn = document.getElementById('closeCardViewerModalBtn') as HTMLButtonElement;
const cardViewerContent = document.getElementById('cardViewerContent') as HTMLDivElement;
const cardViewerPrevBtn = document.getElementById('cardViewerPrevBtn') as HTMLButtonElement;
const cardViewerNextBtn = document.getElementById('cardViewerNextBtn') as HTMLButtonElement;
const cardViewerCounter = document.getElementById('cardViewerCounter') as HTMLSpanElement;

// Edit Solution Modal (Legacy - can be removed if new editor is preferred)
const editSolutionModal = document.getElementById('editSolutionModal') as HTMLDivElement;
const closeEditSolutionModalBtn = document.getElementById('closeEditSolutionModalBtn') as HTMLButtonElement;
const editSolutionForm = document.getElementById('editSolutionForm') as HTMLFormElement;
const editSolutionTitleInput = document.getElementById('editSolutionTitleInput') as HTMLInputElement;
const editSolutionStepsList = document.getElementById('editSolutionStepsList') as HTMLDivElement;
const addNewSolutionStepBtn = document.getElementById('addNewSolutionStepBtn') as HTMLButtonElement;
const editSolutionFinalAnswerInput = document.getElementById('editSolutionFinalAnswerInput') as HTMLTextAreaElement;

// Exit Unsaved Content Modal
const exitUnsavedModal = document.getElementById('exitUnsavedModal') as HTMLDivElement;
const closeExitUnsavedModalBtn = document.getElementById('closeExitUnsavedModalBtn') as HTMLButtonElement;
const backAndKeepBtn = document.getElementById('backAndKeepBtn') as HTMLButtonElement;
const exitAndDiscardBtn = document.getElementById('exitAndDiscardBtn') as HTMLButtonElement;

// Confirm Exit Unsaved Content Modal
const confirmExitUnsavedModal = document.getElementById('confirmExitUnsavedModal') as HTMLDivElement;
const closeConfirmExitUnsavedModalBtn = document.getElementById('closeConfirmExitUnsavedModalBtn') as HTMLButtonElement;
const cancelExitBtn = document.getElementById('cancelExitBtn') as HTMLButtonElement;
const confirmAndExitBtn = document.getElementById('confirmAndExitBtn') as HTMLButtonElement;


// --- State and Constants ---
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
type StudyView = 'learn' | 'flashcards' | 'guided' | 'match' | 'misto';
type LibraryView = 'history' | 'solutions' | 'cards' | 'exercises' | 'reports';
let activeStudyView: StudyView | null = null;
let activeLibraryView: LibraryView | null = null;
type ActiveItemType = 'exercise' | 'solution' | 'cardSet' | 'report' | 'account' | 'history';
type ActiveConfigMode = 'learn' | 'misto' | 'match';
let activeConfigMode: ActiveConfigMode | null = null;
let isProgrammaticScroll = false;
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzVmNjM2OCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
const SPEECH_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;

// Auth State
let isLoggedIn = false;
let currentUser: User | null = null;

// Library State
let userHistory: HistoryItem[] = [];
let userSolutions: SavedSolution[] = [];
let userFlashcardSets: SavedFlashcardSet[] = [];
let userExercises: SavedExercise[] = [];
let userReports: SavedReport[] = [];
let activeItemId: string | null = null;
let activeItemType: ActiveItemType | null = null;
let activeSubmenu: HTMLElement | null = null;
let activeModal: HTMLElement | null = null;

// Current session data
let currentGeneratedCards: Flashcard[] = [];
let currentSolutionData: Solution | null = null;
let currentExerciseToSave: Omit<SavedExercise, 'id' | 'name'> | null = null;
let currentCardSetInViewer: SavedFlashcardSet | null = null;
let lastExerciseConfig: { count: number, duration: number, topic: string } | null = null;
let currentCardViewerIndex = 0;
let currentQuizRecords: AnswerRecord[] = [];
let attachedFile: { mimeType: string, data: string, name: string } | null = null;
let cameraStream: MediaStream | null = null;

// Paused State
let pausedLearnState: { questions: QuizQuestion[], topic: string, index: number, score: number, time: number, timings: number[], records: AnswerRecord[], initialDuration: number } | null = null;
let pausedMistoState: { questions: MistoQuestion[], topic: string, index: number, score: number, time: number, timings: number[], records: AnswerRecord[], initialDuration: number } | null = null;
let pausedMatchState: { cards: Flashcard[], topic: string, time: number, matchedTerms: string[], matchedDefs: string[], initialDuration: number } | null = null;
let pausedFlashcardState: { cards: Flashcard[], topic: string } | null = null;
let pausedSolutionState: { solution: Solution, topic: string } | null = null;
let pausedReportState: { mode: 'Aprender' | 'Misto' | 'Combinar', topic: string, reportHtml: string, exerciseToSave: Omit<SavedExercise, 'id' | 'name'> | null } | null = null;


// Match Game State
let matchCards: Flashcard[] = [];
let matchTimerInterval: number;
let matchTimeRemaining = 0;
let matchInitialDuration = 0;
let matchedPairs = 0;
let draggedTermElement: HTMLElement | null = null;

// Learn Mode State
let learnQuestions: QuizQuestion[] = [];
let currentQuestionIndex = 0;
let learnScore = 0;
let learnTimerInterval: number;
let learnTimeRemaining = 0;
let learnInitialDuration = 0;
let currentQuestionStartTime = 0;
let learnQuestionTimings: number[] = [];


// Misto Mode State
let mistoQuestions: MistoQuestion[] = [];
let currentMistoQuestionIndex = 0;
let mistoScore = 0;
let mistoTimerInterval: number;
let mistoTimeRemaining = 0;
let mistoInitialDuration = 0;
let currentMistoQuestionStartTime = 0;
let mistoQuestionTimings: number[] = [];


// --- Functions ---

/**
 * Handles showing the correct main view (Home or Library).
 */
function showMainView(viewToShow: 'home' | 'library') {
    homeView.classList.toggle('hidden', viewToShow !== 'home');
    libraryView.classList.toggle('hidden', viewToShow !== 'library');
    studyViewContainer.classList.add('hidden');
    headerBackBtn.classList.add('hidden');
    activeStudyView = null;
    activeLibraryView = null;

    document.querySelectorAll('#sidebar .nav-item').forEach(item => item.classList.remove('active'));
    navHome.classList.toggle('active', viewToShow === 'home');
}

/**
 * Handles showing a specific library content view.
 */
function showLibraryContent(viewToShow: LibraryView) {
    showMainView('library');
    activeLibraryView = viewToShow;

    // Update sidebar active state
    document.querySelectorAll('#sidebar .nav-item').forEach(item => item.classList.remove('active'));
    const activeNavItem = document.querySelector(`.nav-item[data-view="${viewToShow}"]`);
    activeNavItem?.classList.add('active');
    
    // Update library title
    libraryTitle.textContent = activeNavItem?.querySelector('span')?.textContent || 'Sua Biblioteca';

    // Show correct tab content
    document.querySelectorAll('#libraryContent .tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${viewToShow}TabContent`)?.classList.remove('hidden');

    renderLibraryContent();
}

/**
 * Handles showing the correct study mode view.
 */
function showStudyView(viewToShow: StudyView) {
    let pausedStateExists = false;
    switch(viewToShow) {
        case 'learn':
            pausedStateExists = !!pausedLearnState;
            if(pausedReportState?.mode === 'Aprender') {
                learnResults.classList.remove('hidden');
                learnSetup.classList.add('hidden');
                learnQuiz.classList.add('hidden');
                learnReportContainer.innerHTML = pausedReportState.reportHtml;
                currentExerciseToSave = pausedReportState.exerciseToSave;
                if(isLoggedIn && currentExerciseToSave) saveLearnExerciseBtn.classList.remove('hidden');
                if(isLoggedIn) saveLearnReportBtn.classList.remove('hidden');
                pausedReportState = null;
            }
            break;
        case 'misto':
            pausedStateExists = !!pausedMistoState;
            if(pausedReportState?.mode === 'Misto') {
                mistoResults.classList.remove('hidden');
                mistoSetup.classList.add('hidden');
                mistoQuiz.classList.add('hidden');
                mistoReportContainer.innerHTML = pausedReportState.reportHtml;
                currentExerciseToSave = pausedReportState.exerciseToSave;
                if(isLoggedIn && currentExerciseToSave) saveMistoExerciseBtn.classList.remove('hidden');
                if(isLoggedIn) saveMistoReportBtn.classList.remove('hidden');
                pausedReportState = null;
            }
            break;
        case 'match':
            pausedStateExists = !!pausedMatchState;
            if(pausedReportState?.mode === 'Combinar') {
                matchResults.classList.remove('hidden');
                matchSetup.classList.add('hidden');
                matchBoard.classList.add('hidden');
                matchReportContainer.innerHTML = pausedReportState.reportHtml;
                currentExerciseToSave = pausedReportState.exerciseToSave;
                if(isLoggedIn && currentExerciseToSave) saveMatchExerciseBtn.classList.remove('hidden');
                if(isLoggedIn) saveMatchReportBtn.classList.remove('hidden');
                pausedReportState = null;
            }
            break;
        case 'flashcards':
            if (pausedFlashcardState) {
                topicInput.value = pausedFlashcardState.topic;
                currentGeneratedCards = pausedFlashcardState.cards;
                flashcardsContainer.innerHTML = '';
                 currentGeneratedCards.forEach((flashcard) => {
                    const cardDiv = createFlippableCard(flashcard);
                    flashcardsContainer.appendChild(cardDiv);
                });
                if(isLoggedIn) saveFlashcardsBtn.classList.remove('hidden');
                if(isLoggedIn) viewGeneratedCardsBtn.classList.remove('hidden');
                pausedFlashcardState = null;
            }
            break;
        case 'guided':
             if (pausedSolutionState) {
                problemInput.value = pausedSolutionState.topic;
                currentSolutionData = pausedSolutionState.solution;
                renderSolution(currentSolutionData, solutionContainer);
                solutionContainer.classList.add('visible');
                if(isLoggedIn) saveSolutionBtn.classList.remove('hidden');
                pausedSolutionState = null;
            }
            break;
    }
  
    // If a paused exercise exists, show the resume modal instead of the setup screen
    if (pausedStateExists) {
        resumeExerciseModal.classList.remove('hidden');
    }

    activeStudyView = viewToShow;
    homeView.classList.add('hidden');
    libraryView.classList.add('hidden');
    studyViewContainer.classList.remove('hidden');
    headerBackBtn.classList.remove('hidden');

    learnView.classList.toggle('hidden', viewToShow !== 'learn');
    flashcardView.classList.toggle('hidden', viewToShow !== 'flashcards');
    guidedLearningView.classList.toggle('hidden', viewToShow !== 'guided');
    matchView.classList.toggle('hidden', viewToShow !== 'match');
    mistoView.classList.toggle('hidden', viewToShow !== 'misto');
}

/**
 * Clones carousel items to create an infinite scrolling effect.
 */
function setupInfiniteCarousel() {
    if (!carousel) return;

    setTimeout(() => {
        const originalCards = Array.from(carousel.children) as HTMLElement[];
        if (originalCards.length === 0) return;

        const clonesToAppend = originalCards.map(card => card.cloneNode(true));
        const clonesToPrepend = originalCards.map(card => card.cloneNode(true));

        carousel.append(...clonesToAppend);
        carousel.prepend(...clonesToPrepend);
        
        carousel.style.scrollBehavior = 'auto';
        carousel.scrollLeft = carousel.scrollWidth / 3;
        carousel.style.scrollBehavior = 'smooth';
        
        prevBtn.disabled = false;
        nextBtn.disabled = false;
    }, 100);
}


/**
 * Handles the logic for maintaining the infinite carousel loop.
 */
function handleInfiniteScroll() {
    if (!carousel) return;

    const oneThirdWidth = carousel.scrollWidth / 3;
    const currentScroll = carousel.scrollLeft;
    const buffer = 1; // Buffer for floating point inaccuracies

    if (currentScroll >= (oneThirdWidth * 2) - buffer) {
        isProgrammaticScroll = true;
        carousel.style.scrollBehavior = 'auto';
        carousel.scrollLeft = currentScroll - oneThirdWidth;
        carousel.style.scrollBehavior = 'smooth';
    } else if (currentScroll <= oneThirdWidth + buffer) {
        isProgrammaticScroll = true;
        carousel.style.scrollBehavior = 'auto';
        carousel.scrollLeft = currentScroll + oneThirdWidth;
        carousel.style.scrollBehavior = 'smooth';
    }
}


/**
 * Updates the theme toggle button's appearance.
 * @param theme The current theme ('light' or 'dark').
 */
function updateThemeToggleUI(theme: 'light' | 'dark') {
    const isDark = theme === 'dark';
    const text = isDark ? 'Modo claro' : 'Modo escuro';
    const icon = isDark
        ? `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zM18.36 16.95c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zM19.42 5.99c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor"><rect fill="none" height="24" width="24"/><path d="M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36c-0.98,1.37-2.58,2.26-4.4,2.26 c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"/></svg>`;
    
    themeToggleText.textContent = text;
    themeToggleIcon.innerHTML = icon;
    themeToggleTextLoggedOut.textContent = text;
    themeToggleIconLoggedOut.innerHTML = icon;
}


/**
 * Applies the selected theme and saves it to localStorage.
 * @param theme The theme to apply ('light' or 'dark').
 */
function applyTheme(theme: 'light' | 'dark') {
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(theme === 'light' ? 'light-theme' : 'dark-theme');
    localStorage.setItem('theme', theme);
    updateThemeToggleUI(theme);
}

/**
 * Converts a File to a base64 string (stripping the data: prefix).
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Strip the "data:image/png;base64," prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}


// --- Auth Functions ---

function updateAuthUI() {
    body.classList.toggle('logged-in', isLoggedIn);
    
    // Toggle library nav items visibility
    navItems.forEach(item => item.classList.toggle('hidden', !isLoggedIn));

    // User Profile Icon
    loggedOutIcon.classList.toggle('hidden', isLoggedIn);
    loggedInIcon.classList.toggle('hidden', !isLoggedIn);
    
    if (isLoggedIn && currentUser) {
        loggedInIcon.src = currentUser.avatar;
    }

    // Hide all save buttons initially
    saveSolutionBtn.classList.add('hidden');
    saveFlashcardsBtn.classList.add('hidden');
    viewGeneratedCardsBtn.classList.add('hidden');
    saveLearnReportBtn.classList.add('hidden');
    saveLearnExerciseBtn.classList.add('hidden');
    saveMatchReportBtn.classList.add('hidden');
    saveMatchExerciseBtn.classList.add('hidden');
    saveMistoReportBtn.classList.add('hidden');
    saveMistoExerciseBtn.classList.add('hidden');

    if (!isLoggedIn && !homeView.classList.contains('hidden')) {
        showMainView('home');
    }
    
    if(isLoggedIn) {
        loadLibraryFromStorage();
    } else {
        userHistory = [];
        userSolutions = [];
        userFlashcardSets = [];
        userExercises = [];
        userReports = [];
        currentUser = null;
    }
}

function handleLogin(user: User) {
    isLoggedIn = true;
    currentUser = user;
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify(user));
    loginModal.classList.add('hidden');
    userProfileModal.classList.add('hidden');
    updateAuthUI();
}

function handleLogout() {
    isLoggedIn = false;
    currentUser = null;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    userProfileModal.classList.add('hidden');
    updateAuthUI();
    // Go back to home page if logged out from a non-home view
    if(homeView.classList.contains('hidden')){
      showMainView('home');
    }
}

function handleDeleteAccount() {
    const userId = currentUser?.email;
    if (!userId) return;

    // In a real app, this would be a server call. Here we clear localStorage.
    handleLogout();
    localStorage.removeItem(`userHistory_${userId}`);
    localStorage.removeItem(`userSolutions_${userId}`);
    localStorage.removeItem(`userFlashcardSets_${userId}`);
    localStorage.removeItem(`userExercises_${userId}`);
    localStorage.removeItem(`userReports_${userId}`);

    alert('Sua conta e todos os seus dados foram excluídos.');
    // Force reload or redirect to home might be good here
    showMainView('home');
}


// --- Library Functions ---

function loadLibraryFromStorage() {
    if (!isLoggedIn || !currentUser) return;
    const userId = currentUser.email;
    userHistory = JSON.parse(localStorage.getItem(`userHistory_${userId}`) || '[]');
    userSolutions = JSON.parse(localStorage.getItem(`userSolutions_${userId}`) || '[]');
    userFlashcardSets = JSON.parse(localStorage.getItem(`userFlashcardSets_${userId}`) || '[]');
    userExercises = JSON.parse(localStorage.getItem(`userExercises_${userId}`) || '[]');
    userReports = JSON.parse(localStorage.getItem(`userReports_${userId}`) || '[]');
}

function saveLibraryToStorage() {
    if (!isLoggedIn || !currentUser) return;
    const userId = currentUser.email;
    localStorage.setItem(`userHistory_${userId}`, JSON.stringify(userHistory));
    localStorage.setItem(`userSolutions_${userId}`, JSON.stringify(userSolutions));
    localStorage.setItem(`userFlashcardSets_${userId}`, JSON.stringify(userFlashcardSets));
    localStorage.setItem(`userExercises_${userId}`, JSON.stringify(userExercises));
    localStorage.setItem(`userReports_${userId}`, JSON.stringify(userReports));
}

function saveHistoryItem(item: Omit<HistoryItem, 'id' | 'date'>) {
    if (!isLoggedIn) return;
    const newItem: HistoryItem = {
        ...item,
        id: Date.now().toString(),
        date: new Date().toISOString(),
    };
    userHistory.unshift(newItem);
    saveLibraryToStorage();
}

function convertSolutionToMarkdown(solution: Solution): string {
    let md = `# ${solution.title}\n\n`;
    solution.steps.forEach((step, index) => {
        md += `## Passo ${index + 1}: ${step.stepTitle}\n\n`;
        md += `${step.explanation}\n\n`;
        if (step.calculation) {
            md += '```\n' + step.calculation + '\n```\n\n';
        }
    });
    md += `### Resposta Final\n\n${solution.finalAnswer}\n`;
    return md;
}

function saveSolution() {
    if (!isLoggedIn || !currentSolutionData) return;
    const newSolution: SavedSolution = {
        ...currentSolutionData,
        id: Date.now().toString(),
        date: new Date().toISOString(),
        markdownContent: convertSolutionToMarkdown(currentSolutionData),
    };
    userSolutions.unshift(newSolution);
    saveLibraryToStorage();
    alert('Solução salva na sua biblioteca!');
    saveSolutionBtn.classList.add('hidden');
}


function renderLibraryContent() {
    if (!isLoggedIn || !activeLibraryView) return;

    switch (activeLibraryView) {
        case 'history':
            renderHistory();
            break;
        case 'solutions':
            renderSolutions();
            break;
        case 'cards':
            renderCardSets();
            break;
        case 'exercises':
            renderExercises();
            break;
        case 'reports':
            renderReports();
            break;
    }
}

function renderHistory() {
    const filterValue = (historyTabContent.querySelector('.tab-btn.active') as HTMLElement)?.dataset.filter || 'all';
    const sortValue = (document.getElementById('historySort') as HTMLSelectElement).value;

    let filteredHistory = userHistory;

    if (filterValue !== 'all') {
        if (filterValue === 'Exercises') {
            filteredHistory = userHistory.filter(item => ['Aprender', 'Combinar', 'Misto'].includes(item.mode));
        } else {
            filteredHistory = userHistory.filter(item => item.mode === filterValue);
        }
    }
    
    filteredHistory.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortValue === 'recent' ? dateB - dateA : dateA - dateB;
    });

    const tbody = historyTable.querySelector('tbody');
    if (tbody) {
        tbody.innerHTML = filteredHistory.length > 0
            ? filteredHistory.map(item => `
                <tr data-id="${item.id}" data-type="history">
                    <td>${item.mode}</td>
                    <td>${item.topic}</td>
                    <td>${item.score}</td>
                    <td>${new Date(item.date).toLocaleString('pt-BR')}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="4">Nenhum histórico encontrado.</td></tr>';
    }
}

function renderSolutions() {
     solutionsTabContent.innerHTML = userSolutions.length > 0
        ? userSolutions.map(sol => `
            <div class="folder-item" data-id="${sol.id}" data-type="solution">
                 <svg class="folder-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M14.17 5L19 9.83V19H5V5h9.17M14 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9l-6-6zM8 14h8v2H8v-2zm0-3h8v2H8v-2zm0-3h5v2H8V8z"/></svg>
                <div class="folder-info">
                    <span class="name">${sol.title}</span>
                    <span class="count">${new Date(sol.date).toLocaleDateString('pt-BR')}</span>
                </div>
            </div>
        `).join('')
        : '<p>Nenhuma solução salva. Use a Aprendizagem Guiada e salve soluções para vê-las aqui.</p>';
}

function renderCardSets() {
    cardsTabContent.innerHTML = userFlashcardSets.length > 0
        ? userFlashcardSets.map(folder => `
            <div class="folder-item" data-id="${folder.id}" data-type="cardSet">
                <svg class="folder-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                <div class="folder-info">
                    <div class="name">${folder.name}</div>
                    <div class="count">${folder.cards.length} ${folder.cards.length === 1 ? 'cartão' : 'cartões'}</div>
                </div>
            </div>
        `).join('')
        : '<p>Nenhuma pasta de cartões criada. Salve um conjunto de cartões para vê-lo aqui.</p>';
}

function renderExercises() {
    exercisesTabContent.innerHTML = userExercises.length > 0
        ? userExercises.map(folder => `
            <div class="folder-item" data-id="${folder.id}" data-type="exercise">
                <svg class="folder-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                <div class="folder-info">
                    <div class="name">${folder.name}</div>
                    <div class="count">${folder.mode} - ${folder.topic}</div>
                </div>
            </div>
        `).join('')
        : '<p>Nenhum exercício salvo. Salve um quiz ou jogo para praticar depois.</p>';
}

function renderReports() {
    const filterValue = (reportsTabContent.querySelector('.tab-btn.active') as HTMLElement)?.dataset.filter || 'all';
    const sortValue = (document.getElementById('reportSort') as HTMLSelectElement).value;
    const reportsList = document.getElementById('reportsList');
    if (!reportsList) return;

    let filteredReports = userReports;

    if (filterValue !== 'all') {
        filteredReports = userReports.filter(item => item.mode === filterValue);
    }
    
    filteredReports.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortValue === 'recent' ? dateB - dateA : dateA - dateB;
    });

    reportsList.innerHTML = filteredReports.length > 0
        ? filteredReports.map(report => `
            <div class="folder-item" data-id="${report.id}" data-type="report">
                <svg class="folder-icon" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                <div class="folder-info">
                    <div class="name">Relatório: ${report.topic}</div>
                    <div class="count">${report.mode} - ${new Date(report.date).toLocaleDateString('pt-BR')}</div>
                </div>
            </div>
        `).join('')
        : '<p>Nenhum relatório salvo. Complete um exercício para gerar e salvar um relatório.</p>';
}

/**
 * Parses text into an array of Flashcard objects.
 * @param text The text to parse.
 * @returns An array of flashcards.
 */
function parseFlashcards(text: string): Flashcard[] {
    return text
        .split('\n')
        .map((line) => {
            const parts = line.split(':');
            if (parts.length >= 2 && parts[0].trim()) {
                const term = parts[0].trim();
                const definition = parts.slice(1).join(':').trim();
                if (definition) return {term, definition};
            }
            return null;
        })
        .filter((card): card is Flashcard => card !== null);
}

/**
 * Renders the structured solution from the AI into a target element.
 * @param data The parsed JSON data for the solution.
 * @param targetEl The HTML element to render the solution into.
 */
function renderSolution(data: Solution, targetEl: HTMLElement) {
    targetEl.innerHTML = ''; // Clear previous content

    const container = document.createElement('div');
    container.className = 'solution-container visible';
    
    const titleEl = document.createElement('h3');
    titleEl.innerHTML = `
        <div class="speech-text-wrapper">
            <span class="text-to-speak">${data.title}</span>
            <button class="speech-btn" title="Ouvir título">${SPEECH_ICON_SVG}</button>
        </div>
    `;
    container.appendChild(titleEl);

    data.steps.forEach(step => {
        const stepEl = document.createElement('div');
        stepEl.classList.add('solution-step');

        const stepTitleEl = document.createElement('h4');
        stepTitleEl.innerHTML = `
             <div class="speech-text-wrapper">
                <span class="text-to-speak">${step.stepTitle}</span>
                <button class="speech-btn" title="Ouvir passo">${SPEECH_ICON_SVG}</button>
            </div>
        `;
        stepEl.appendChild(stepTitleEl);

        const explanationEl = document.createElement('p');
        const parsedExplanation = marked.parse(step.explanation) as string;
        explanationEl.innerHTML = `
            <div class="speech-text-wrapper">
                <span class="text-to-speak">${parsedExplanation}</span>
                <button class="speech-btn" title="Ouvir explicação">${SPEECH_ICON_SVG}</button>
            </div>
        `;
        stepEl.appendChild(explanationEl);

        if (step.calculation) {
            const calculationEl = document.createElement('code');
            calculationEl.textContent = step.calculation;
            stepEl.appendChild(calculationEl);
        }

        container.appendChild(stepEl);
    });

    const finalAnswerEl = document.createElement('div');
    finalAnswerEl.classList.add('final-answer');
    const finalAnswerTitle = document.createElement('strong');
    finalAnswerTitle.textContent = 'Resposta Final';

    const finalAnswerText = document.createElement('div');
    finalAnswerText.innerHTML = `
         <div class="speech-text-wrapper">
            <span class="text-to-speak">${data.finalAnswer}</span>
            <button class="speech-btn" title="Ouvir resposta final">${SPEECH_ICON_SVG}</button>
        </div>
    `;

    finalAnswerEl.appendChild(finalAnswerTitle);
    finalAnswerEl.appendChild(finalAnswerText);
    container.appendChild(finalAnswerEl);
    
    targetEl.appendChild(container);
}

/**
 * Shuffles an array in place.
 */
function shuffle(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createFlippableCard(flashcard: Flashcard): HTMLElement {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('flashcard');
    cardDiv.setAttribute('aria-label', `Flashcard. Frente: ${flashcard.term}. Clique para virar.`);

    const cardInner = document.createElement('div');
    cardInner.classList.add('flashcard-inner');

    const cardFront = document.createElement('div');
    cardFront.classList.add('flashcard-front');
    const termDiv = document.createElement('div');
    termDiv.classList.add('term');
    termDiv.innerHTML = `
        <div class="speech-text-wrapper">
            <div class="text-to-speak">${flashcard.term}</div>
            <button class="speech-btn" title="Ouvir termo">${SPEECH_ICON_SVG}</button>
        </div>
    `;
    cardFront.appendChild(termDiv);

    const cardBack = document.createElement('div');
    cardBack.classList.add('flashcard-back');
    const definitionDiv = document.createElement('div');
    definitionDiv.classList.add('definition');
    definitionDiv.innerHTML = `
        <div class="speech-text-wrapper">
            <div class="text-to-speak">${flashcard.definition}</div>
            <button class="speech-btn" title="Ouvir definição">${SPEECH_ICON_SVG}</button>
        </div>
    `;
    cardBack.appendChild(definitionDiv);

    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    cardDiv.appendChild(cardInner);

    cardDiv.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.speech-btn')) return;
        cardDiv.classList.toggle('flipped');
        const isFlipped = cardDiv.classList.contains('flipped');
        if (isFlipped) {
            cardDiv.setAttribute('aria-label', `Flashcard. Verso: ${flashcard.definition}. Clique para virar.`);
        } else {
            cardDiv.setAttribute('aria-label', `Flashcard. Frente: ${flashcard.term}. Clique para virar.`);
        }
    });
    return cardDiv;
}

function renderCardInViewer() {
    if (!currentCardSetInViewer || !cardViewerContent) return;

    const cards = currentCardSetInViewer.cards;
    if (cards.length === 0) {
        cardViewerContent.innerHTML = '<p>Nenhum cartão para exibir.</p>';
        cardViewerCounter.textContent = '0/0';
        cardViewerPrevBtn.disabled = true;
        cardViewerNextBtn.disabled = true;
        return;
    }
    
    // Ensure index is within bounds
    if (currentCardViewerIndex < 0) currentCardViewerIndex = 0;
    if (currentCardViewerIndex >= cards.length) currentCardViewerIndex = cards.length - 1;

    const card = cards[currentCardViewerIndex];
    cardViewerContent.innerHTML = '';
    const cardElement = createFlippableCard(card);
    // Make sure the card is not flipped initially when rendered in the viewer
    cardElement.classList.remove('flipped');
    cardViewerContent.appendChild(cardElement);

    cardViewerCounter.textContent = `${currentCardViewerIndex + 1} / ${cards.length}`;
    cardViewerPrevBtn.disabled = currentCardViewerIndex === 0;
    cardViewerNextBtn.disabled = currentCardViewerIndex === cards.length - 1;
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.add('hidden'));
}

async function downloadContent(format: 'md' | 'pdf' | 'doc') {
    if (!activeItemType || !activeItemId) return;

    let contentToDownload = '';
    let elementToRender: HTMLElement | null = null;
    let fileName = `${activeItemType}-${activeItemId}`;

    if (activeItemType === 'solution') {
        const solution = userSolutions.find(s => s.id === activeItemId);
        if (!solution) return;
        fileName = `solucao-${solution.title.replace(/ /g, '_')}`;
        elementToRender = solutionDetailContent;
        if (solution.markdownContent) {
            contentToDownload = solution.markdownContent;
            elementToRender.innerHTML = marked.parse(contentToDownload) as string;
        } else {
            contentToDownload = convertSolutionToMarkdown(solution);
            renderSolution(solution, elementToRender);
        }
    } else if (activeItemType === 'report') {
        const report = userReports.find(r => r.id === activeItemId);
        if (!report) return;
        fileName = `relatorio-${report.topic.replace(/ /g, '_')}`;
        elementToRender = reportViewerContent;
        contentToDownload = report.content; // It's HTML, not MD
        elementToRender.innerHTML = contentToDownload;
    }

    if (!elementToRender) return;

    if (format === 'pdf') {
        const modal = elementToRender.closest('.modal-overlay') as HTMLElement;
        const wasHidden = modal.classList.contains('hidden');
        
        // Make the modal renderable but not visible to the user
        if (wasHidden) {
            modal.style.visibility = 'hidden';
            modal.classList.remove('hidden');
        }
        
        // Clone the content and remove problematic SVGs for rendering
        const cleanElement = elementToRender.cloneNode(true) as HTMLElement;
        cleanElement.querySelectorAll('.speech-btn').forEach(btn => btn.remove());
        
        // Temporarily replace original with clean version for canvas capture
        const originalContent = elementToRender.innerHTML;
        elementToRender.innerHTML = cleanElement.innerHTML;

        try {
            const canvas = await html2canvas(elementToRender, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${fileName}.pdf`);
        } catch(e) {
            console.error("PDF Generation Error:", e);
            alert("Ocorreu um erro ao gerar o PDF.");
        } finally {
             // Restore original content and modal state
            elementToRender.innerHTML = originalContent;
            if (wasHidden) {
                modal.classList.add('hidden');
                modal.style.visibility = '';
            }
        }
    } else { // MD or DOC
        if (activeItemType === 'report') { // Convert HTML to something downloadable
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = contentToDownload;
            contentToDownload = tempDiv.innerText; // Basic text conversion
        }

        const mimeType = format === 'md' ? 'text/markdown' : 'application/msword';
        const blob = new Blob([contentToDownload], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.${format === 'doc' ? 'doc' : 'md'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    if(activeSubmenu) activeSubmenu.classList.add('hidden');
}


// --- Event Listeners ---

// App Shell
navHome?.addEventListener('click', (e) => { e.preventDefault(); showMainView('home'); });
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = (item as HTMLElement).dataset.view as LibraryView;
        if (view) {
            showLibraryContent(view);
        }
    });
});

// User Profile & Auth
userProfileBtn?.addEventListener('click', () => {
    userProfileModal.classList.remove('hidden');
    if (isLoggedIn && currentUser) {
        loggedInUserView.classList.remove('hidden');
        loggedOutUserView.classList.add('hidden');
        userInfoAvatar.src = currentUser.avatar;
        userInfoName.textContent = currentUser.name;
        userInfoEmail.textContent = currentUser.email;
    } else {
        loggedInUserView.classList.add('hidden');
        loggedOutUserView.classList.remove('hidden');
    }
});

closeUserProfileModalBtn.addEventListener('click', () => userProfileModal.classList.add('hidden'));

document.addEventListener('click', (e) => {
    const target = e.target as Node;
    const targetEl = e.target as HTMLElement;

    // Close any open submenus
    if (activeSubmenu && !activeSubmenu.parentElement?.contains(target)) {
        activeSubmenu.classList.add('hidden');
        activeSubmenu.parentElement?.querySelector('.submenu-arrow')?.classList.remove('open');
        activeSubmenu = null;
    }
    
    // Handle opening submenus
    const submenuBtn = targetEl.closest('.user-menu-item-with-submenu > button');
    if (submenuBtn) {
        const parent = submenuBtn.parentElement;
        const submenu = parent?.querySelector('.submenu') as HTMLElement;
        if(submenu) {
            const isOpening = submenu.classList.contains('hidden');
            // Close any other open submenus first
            if(activeSubmenu && activeSubmenu !== submenu) {
                activeSubmenu.classList.add('hidden');
                activeSubmenu.parentElement?.querySelector('.submenu-arrow')?.classList.remove('open');
            }
            submenu.classList.toggle('hidden');
            submenuBtn.querySelector('.submenu-arrow')?.classList.toggle('open', isOpening);
            activeSubmenu = isOpening ? submenu : null;
        }
    }
    
    // Handle download clicks
    const downloadBtn = targetEl.closest<HTMLElement>('.submenu-item[data-format]');
    if (downloadBtn) {
        downloadContent(downloadBtn.dataset.format as 'md'|'pdf'|'doc');
    }

});

loginEmailBtn?.addEventListener('click', () => {
    userProfileModal.classList.add('hidden');
    loginModal.classList.remove('hidden')
});

loginGoogleBtn?.addEventListener('click', () => {
    handleLogin({
        name: 'Usuário Google',
        email: 'google.user@email.com',
        avatar: 'https://lh3.googleusercontent.com/a/ACg8ocK_s8n1a-2z3rA-YdM4qM-fCH59a2qZ8-rF1GkGv2g=s96-c'
    });
});

closeLoginModalBtn?.addEventListener('click', () => {
    loginModal.classList.add('hidden');
    loginForm.reset();
    loginError.textContent = '';
});

loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    if (email === 'teste@gmail.com' && password === 'Teste2025') {
        handleLogin({
            name: 'Usuário Teste',
            email: 'teste@gmail.com',
            avatar: DEFAULT_AVATAR
        });
    } else {
        loginError.textContent = 'E-mail ou senha inválidos.';
    }
});

logoutBtn?.addEventListener('click', handleLogout);

// Settings Modal
settingsBtn?.addEventListener('click', () => {
    userProfileModal.classList.add('hidden');
    settingsModal.classList.remove('hidden');
    if(currentUser) {
        settingsAvatarPreview.src = currentUser.avatar;
        settingsNameInput.value = currentUser.name;
        settingsEmailInput.value = currentUser.email;
    }
});
closeSettingsModalBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

settingsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        settingsTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        settingsTabContents.forEach(content => {
            content.classList.toggle('active', content.dataset.content === tabName);
        });
    });
});

uploadAvatarBtn.addEventListener('click', () => avatarUploadInput.click());
avatarUploadInput.addEventListener('change', () => {
    if (avatarUploadInput.files && avatarUploadInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            settingsAvatarPreview.src = e.target?.result as string;
        };
        reader.readAsDataURL(avatarUploadInput.files[0]);
    }
});
removeAvatarBtn.addEventListener('click', () => {
    settingsAvatarPreview.src = DEFAULT_AVATAR;
    avatarUploadInput.value = '';
});

profileSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUser) return;

    currentUser.name = settingsNameInput.value;
    currentUser.email = settingsEmailInput.value;
    currentUser.avatar = settingsAvatarPreview.src;
    
    loggedInIcon.src = currentUser.avatar;

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    alert('Perfil atualizado com sucesso!');
    settingsModal.classList.add('hidden');
});

securitySettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // In a real app, you'd verify the current password and then update it.
    if (newPasswordInput.value !== confirmPasswordInput.value) {
        alert('As novas senhas não coincidem.');
        return;
    }
    alert('Senha alterada com sucesso! (Simulação)');
    securitySettingsForm.reset();
});

deleteAccountBtn.addEventListener('click', () => {
    activeItemType = 'account';
    confirmDeleteTitle.textContent = 'Excluir Conta Permanentemente';
    confirmDeleteText.textContent = 'Tem certeza que deseja excluir sua conta? Todos os seus dados serão perdidos para sempre. Esta ação não pode ser desfeita.';
    confirmDeleteModal.classList.remove('hidden');
});


// Theme Toggle
[themeToggleBtn, themeToggleBtnLoggedOut].forEach(btn => {
    btn?.addEventListener('click', () => {
        const currentTheme = body.classList.contains('dark-theme') ? 'dark' : 'light';
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
});


// Carousel Navigation
prevBtn?.addEventListener('click', () => {
    const card = carousel.querySelector('.study-mode-card') as HTMLDivElement;
    const scrollAmount = card ? card.offsetWidth + 20 : 260;
    carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
});

nextBtn?.addEventListener('click', () => {
    const card = carousel.querySelector('.study-mode-card') as HTMLDivElement;
    const scrollAmount = card ? card.offsetWidth + 20 : 260;
    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
});

let scrollEndTimer: number;
carousel?.addEventListener('scroll', () => {
    // If the scroll was triggered by our jump, do nothing for now
    if (isProgrammaticScroll) {
        isProgrammaticScroll = false;
        return;
    }
    // Debounce the user's scroll to call the handler
    clearTimeout(scrollEndTimer);
    scrollEndTimer = window.setTimeout(handleInfiniteScroll, 150);
});

// View Switching (using event delegation on the carousel)
carousel?.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest('.study-mode-card');
    if (!card) return;

    switch (card.id) {
        case 'mode-aprender': showStudyView('learn'); break;
        case 'mode-cartoes': showStudyView('flashcards'); break;
        case 'mode-guiada': showStudyView('guided'); break;
        case 'mode-combinar': showStudyView('match'); break;
        case 'mode-misto': showStudyView('misto'); break;
    }
});

headerBackBtn.addEventListener('click', () => {
    let isExerciseStarted = false;
    let hasGeneratedContent = false;
    let isOnResultsScreen = false;

    switch (activeStudyView) {
        case 'learn':
            isExerciseStarted = learnQuiz.classList.contains('hidden') === false;
            isOnResultsScreen = learnResults.classList.contains('hidden') === false;
            break;
        case 'misto':
            isExerciseStarted = mistoQuiz.classList.contains('hidden') === false;
            isOnResultsScreen = mistoResults.classList.contains('hidden') === false;
            break;
        case 'match':
            isExerciseStarted = matchBoard.classList.contains('hidden') === false;
            isOnResultsScreen = matchResults.classList.contains('hidden') === false;
            break;
        case 'flashcards':
            hasGeneratedContent = currentGeneratedCards.length > 0;
            break;
        case 'guided':
            hasGeneratedContent = currentSolutionData !== null;
            break;
    }

    if (isExerciseStarted) {
        pauseExitModal.classList.remove('hidden');
    } else if (hasGeneratedContent || isOnResultsScreen) {
        exitUnsavedModal.classList.remove('hidden');
    } else {
        // Clear file attachment state on back
        attachedFile = null;
        filePreviewArea.classList.add('hidden');
        showMainView('home');
    }
});

// Library Controls
document.querySelectorAll('.library-controls .tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
        tab.parentElement?.querySelector('.active')?.classList.remove('active');
        tab.classList.add('active');
        renderLibraryContent();
    });
});
document.querySelectorAll('.sort-select').forEach(select => {
    select.addEventListener('change', () => renderLibraryContent());
});

[historyTabContent, solutionsTabContent, cardsTabContent, exercisesTabContent, reportsTabContent].forEach(container => {
    container.addEventListener('click', (e) => {
        const itemEl = (e.target as HTMLElement).closest<HTMLElement>('[data-id]');
        if (!itemEl) return;

        activeItemId = itemEl.dataset.id || null;
        activeItemType = itemEl.dataset.type as ActiveItemType || null;
        if (!activeItemId || !activeItemType) return;
        
        switch (activeItemType) {
            case 'solution':
                activeModal = solutionActionsModal;
                break;
            case 'cardSet':
                activeModal = cardActionsModal;
                break;
            case 'exercise':
                activeModal = exerciseActionsModal;
                break;
            case 'report':
                activeModal = reportActionsModal;
                break;
            case 'history':
                const historyItem = userHistory.find(h => h.id === activeItemId);
                if (historyItem) {
                    historyReportContent.innerHTML = `
                        <h4>Detalhes do Histórico</h4>
                        <p><strong>Modo:</strong> ${historyItem.mode}</p>
                        <p><strong>Tópico:</strong> ${historyItem.topic}</p>
                        <p><strong>Pontuação/Resultado:</strong> ${historyItem.score}</p>
                        <p><strong>Data:</strong> ${new Date(historyItem.date).toLocaleString('pt-BR')}</p>
                        ${historyItem.details ? `<p><strong>Tempo Total:</strong> ${historyItem.details.totalTime}s</p>` : ''}
                    `;
                    historyReportModal.classList.remove('hidden');
                }
                return;
        }
        
        if (activeModal) {
            activeModal.classList.remove('hidden');
        }
    });
});


// Flashcard Generator Logic
generateButton.addEventListener('click', async () => {
  const topic = topicInput.value.trim();
  if (!topic) {
    errorMessage.textContent = 'Por favor, insira um tópico.';
    return;
  }
  errorMessage.textContent = 'Gerando flashcards...';
  generateButton.disabled = true;
  saveFlashcardsBtn.classList.add('hidden');
  viewGeneratedCardsBtn.classList.add('hidden');
  currentGeneratedCards = [];

  try {
    const prompt = `Gere uma lista de flashcards para o tópico de "${topic}". Formate a saída como "Termo: Definição", um por linha.`;
    const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    const responseText = result.text;

    if (responseText) {
      const flashcards = parseFlashcards(responseText);
      if (flashcards.length > 0) {
        currentGeneratedCards = flashcards;
        errorMessage.textContent = '';
        flashcardsContainer.innerHTML = '';
        flashcards.forEach((flashcard) => {
            const cardDiv = createFlippableCard(flashcard);
            flashcardsContainer.appendChild(cardDiv);
        });

        if (isLoggedIn) {
            saveFlashcardsBtn.classList.remove('hidden');
        }
        viewGeneratedCardsBtn.classList.remove('hidden');
        saveHistoryItem({ mode: 'Cartões', topic, score: `${flashcards.length} cartões gerados` });

      } else {
        errorMessage.textContent = 'Não foi possível gerar flashcards válidos.';
      }
    } else {
      errorMessage.textContent = 'Falha ao gerar flashcards.';
    }
  } catch (error) {
    errorMessage.textContent = `Ocorreu um erro: ${(error as Error).message}`;
  } finally {
    generateButton.disabled = false;
  }
});

viewGeneratedCardsBtn.addEventListener('click', () => {
    if (currentGeneratedCards.length > 0) {
        currentCardSetInViewer = {
            id: 'generated-set',
            name: 'Cartões Gerados',
            cards: currentGeneratedCards
        };
        currentCardViewerIndex = 0;
        cardViewerModal.classList.remove('hidden');
        renderCardInViewer();
    }
});

saveFlashcardsBtn.addEventListener('click', () => {
    if (!currentGeneratedCards.length) return;
    
    flashcardFolderNameInput.value = `Cartões: ${topicInput.value.trim()}`;
    selectableCardList.innerHTML = currentGeneratedCards.map((card, index) => `
        <label class="selectable-card">
            <input type="checkbox" checked data-index="${index}">
            <div class="selectable-card-content">
                <div class="selectable-card-term">${card.term}</div>
                <div class="selectable-card-definition">${card.definition}</div>
            </div>
        </label>
    `).join('');

    saveFlashcardsModal.classList.remove('hidden');
});


// Guided Learning Logic - File Attachment & Camera

guidedFileBtn.addEventListener('click', () => guidedFileInput.click());

guidedFileInput.addEventListener('change', async () => {
    if (guidedFileInput.files && guidedFileInput.files[0]) {
        const file = guidedFileInput.files[0];
        try {
            const base64 = await fileToBase64(file);
            attachedFile = {
                mimeType: file.type,
                data: base64,
                name: file.name
            };
            fileNamePreview.textContent = file.name;
            filePreviewArea.classList.remove('hidden');
        } catch (e) {
            alert("Erro ao ler arquivo.");
        }
    }
});

removeFileBtn.addEventListener('click', () => {
    attachedFile = null;
    filePreviewArea.classList.add('hidden');
    guidedFileInput.value = '';
});

// Camera Logic
guidedCameraBtn.addEventListener('click', async () => {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraVideo.srcObject = cameraStream;
        cameraPreviewArea.classList.remove('hidden');
    } catch (e) {
        alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
});

closeCameraBtn.addEventListener('click', () => {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    cameraPreviewArea.classList.add('hidden');
});

captureBtn.addEventListener('click', () => {
    if (!cameraStream) return;
    
    cameraCanvas.width = cameraVideo.videoWidth;
    cameraCanvas.height = cameraVideo.videoHeight;
    const context = cameraCanvas.getContext('2d');
    if (context) {
        context.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);
        const dataUrl = cameraCanvas.toDataURL('image/jpeg');
        // Strip prefix for Gemini
        const base64 = dataUrl.split(',')[1];
        
        attachedFile = {
            mimeType: 'image/jpeg',
            data: base64,
            name: 'Foto_Capturada.jpg'
        };
        
        fileNamePreview.textContent = 'Foto_Capturada.jpg';
        filePreviewArea.classList.remove('hidden');
        
        // Close camera view
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
        cameraPreviewArea.classList.add('hidden');
    }
});

// Guided Learning Logic - Solve
solveButton.addEventListener('click', async () => {
    const problem = problemInput.value.trim();
    
    if (!problem && !attachedFile) {
        solutionMessage.textContent = 'Por favor, insira um problema ou anexe um arquivo/imagem.';
        return;
    }
    
    solutionMessage.textContent = 'Analisando e encontrando a solução...';
    solveButton.disabled = true;
    saveSolutionBtn.classList.add('hidden');

    try {
        const promptText = problem 
            ? `Aja como um tutor especialista. Forneça uma solução passo a passo detalhada para o seguinte problema. Gere uma resposta JSON que corresponda ao esquema fornecido. O problema é:\n\n${problem}`
            : `Aja como um tutor especialista. Analise a imagem ou documento fornecido e forneça uma solução passo a passo detalhada para o problema identificado. Gere uma resposta JSON que corresponda ao esquema fornecido.`;

        const solutionSchema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                steps: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            stepTitle: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                            calculation: { type: Type.STRING, nullable: true },
                        },
                         required: ['stepTitle', 'explanation'],
                    },
                },
                finalAnswer: { type: Type.STRING },
            },
            required: ['title', 'steps', 'finalAnswer'],
        };

        const parts: any[] = [{ text: promptText }];
        
        if (attachedFile) {
            parts.push({
                inlineData: {
                    mimeType: attachedFile.mimeType,
                    data: attachedFile.data
                }
            });
        }

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: { parts: parts },
            config: { responseMimeType: 'application/json', responseSchema: solutionSchema },
        });

        const responseText = result.text.trim();
        if (responseText) {
            const solutionData: Solution = JSON.parse(responseText);
            solutionMessage.textContent = '';
            renderSolution(solutionData, solutionContainer);
            solutionContainer.classList.add('visible');
    
            currentSolutionData = solutionData;
            saveHistoryItem({
                mode: 'Aprendizagem Guiada',
                topic: solutionData.title || 'Problema Resolvido',
                score: 'Solução gerada'
            });

            if (isLoggedIn) {
                saveSolutionBtn.classList.remove('hidden');
            }
        } else {
             solutionMessage.textContent = 'A IA não retornou uma solução.';
        }
    } catch (error) {
        solutionMessage.textContent = `Ocorreu um erro: ${(error as Error).message}`;
    } finally {
        solveButton.disabled = false;
    }
});

saveSolutionBtn.addEventListener('click', saveSolution);


// --- Match Game Logic ---
function setupMatchGame(cards: Flashcard[], durationInSeconds: number, savedMatchedTerms: string[] = [], savedMatchedDefs: string[] = []) {
    matchSetup.classList.add('hidden');
    matchResults.classList.add('hidden');
    matchBoard.classList.remove('hidden');
    
    matchTimeRemaining = savedMatchedTerms.length > 0 ? durationInSeconds : matchInitialDuration;
    matchedPairs = savedMatchedTerms.length;
    
    scoreEl.textContent = `Combinados: ${matchedPairs}/${cards.length}`;
    timerEl.textContent = `Tempo: ${matchTimeRemaining}s`;

    const terms = shuffle(cards.map(card => card.term));
    const definitions = shuffle(cards.map(card => card.definition));

    termsContainer.innerHTML = '';
    definitionsContainer.innerHTML = '';

    terms.forEach(term => {
        const cardEl = document.createElement('div');
        cardEl.className = 'match-card term-card';
        cardEl.textContent = term;
        cardEl.draggable = true;
        cardEl.dataset.term = term;
        if (savedMatchedTerms.includes(term)) {
            cardEl.classList.add('matched');
            cardEl.draggable = false;
        }
        termsContainer.appendChild(cardEl);
    });

    definitions.forEach(definition => {
        const cardEl = document.createElement('div');
        cardEl.className = 'match-card definition-card';
        cardEl.textContent = definition;
        cardEl.dataset.definition = definition;
        if (savedMatchedDefs.includes(definition)) {
            cardEl.classList.add('matched');
        }
        definitionsContainer.appendChild(cardEl);
    });
    
    addDragDropListeners();
    startMatchCountdown();
}

function startMatchCountdown() {
    clearInterval(matchTimerInterval);
    matchTimerInterval = window.setInterval(() => {
        matchTimeRemaining--;
        timerEl.textContent = `Tempo: ${matchTimeRemaining}s`;
        if (matchTimeRemaining <= 0) {
            endMatchGame(false);
        }
    }, 1000);
}

function addDragDropListeners() {
    document.querySelectorAll('.term-card').forEach(c => { c.addEventListener('dragstart', handleDragStart); c.addEventListener('dragend', handleDragEnd); });
    document.querySelectorAll('.definition-card').forEach(c => { c.addEventListener('dragover', handleDragOver); c.addEventListener('dragleave', handleDragLeave); c.addEventListener('drop', handleDrop); });
}

function handleDragStart(e: DragEvent) {
    draggedTermElement = e.target as HTMLElement;
    draggedTermElement.classList.add('dragging');
}

function handleDragEnd() {
    draggedTermElement?.classList.remove('dragging');
    draggedTermElement = null;
}

function handleDragOver(e: DragEvent) {
    e.preventDefault();
    const target = e.target as HTMLElement;
    if (target.classList.contains('definition-card') && !target.classList.contains('matched')) target.classList.add('drag-over');
}

function handleDragLeave(e: DragEvent) { (e.target as HTMLElement).classList.remove('drag-over'); }

function handleDrop(e: DragEvent) {
    e.preventDefault();
    const dropTarget = e.target as HTMLElement;
    dropTarget.classList.remove('drag-over');

    if (!draggedTermElement || !dropTarget.classList.contains('definition-card') || dropTarget.classList.contains('matched')) return;
    
    const term = draggedTermElement.dataset.term;
    const definition = dropTarget.dataset.definition;
    const correctCard = matchCards.find(card => card.term === term);

    if (correctCard && correctCard.definition === definition) {
        draggedTermElement.classList.add('matched');
        dropTarget.classList.add('matched');
        draggedTermElement.draggable = false;
        matchedPairs++;
        scoreEl.textContent = `Combinados: ${matchedPairs}/${matchCards.length}`;
        if (matchedPairs === matchCards.length) endMatchGame(true);
    } else {
        dropTarget.classList.add('incorrect-flash');
        setTimeout(() => dropTarget.classList.remove('incorrect-flash'), 500);
    }
}

function endMatchGame(completed: boolean) {
    clearInterval(matchTimerInterval);
    matchBoard.classList.add('hidden');
    matchResults.classList.remove('hidden');

    const topic = matchTopicInput.value.trim() || (currentExerciseToSave?.topic ?? '');
    const timeTaken = matchInitialDuration - matchTimeRemaining;

    saveHistoryItem({
        mode: 'Combinar',
        topic: topic,
        score: completed ? `${timeTaken}s` : `${matchedPairs}/${matchCards.length} (tempo esgotado)`,
        details: { totalTime: timeTaken, timePerQuestion: [] }
    });
    
    if (isLoggedIn) {
        currentExerciseToSave = {
            mode: 'Combinar',
            topic: topic,
            data: matchCards,
        };
    }
    
    endMatchAndGenerateReport(topic, timeTaken, completed);
}

function resetMatchMode() {
    matchResults.classList.add('hidden');
    matchBoard.classList.add('hidden');
    matchSetup.classList.remove('hidden');
    matchTopicInput.value = '';
    matchMessage.textContent = '';
    pausedMatchState = null;
    currentExerciseToSave = null;
}

async function initiateMatchGame(count: number, duration: number) {
    const topic = matchTopicInput.value.trim();
    if (!topic) {
        matchMessage.textContent = 'Por favor, insira um tópico.';
        return;
    }
    currentExerciseToSave = null;
    matchMessage.textContent = `Gerando jogo...`;
    startGameBtn.disabled = true;
    saveMatchExerciseBtn.classList.add('hidden');
    saveMatchReportBtn.classList.add('hidden');
    try {
        const prompt = `Gere ${count} pares de termo e definição para um jogo sobre "${topic}". Formate como "Termo: Definição", um por linha.`;
        const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const cards = parseFlashcards(result.text);
        if (cards.length >= count) {
            matchCards = cards.slice(0, count);
            matchMessage.textContent = '';
            matchInitialDuration = duration;
            setupMatchGame(matchCards, duration);
        } else {
            matchMessage.textContent = 'Não foi possível gerar pares suficientes.';
        }
    } catch(error) {
        matchMessage.textContent = 'Ocorreu um erro ao gerar o jogo.';
    } finally {
        startGameBtn.disabled = false;
    }
}

playAgainBtn.addEventListener('click', () => setupMatchGame(matchCards, matchInitialDuration));
newMatchGameBtn.addEventListener('click', resetMatchMode);


// --- Learn Mode Logic ---
function startLearnQuiz(questions: QuizQuestion[], topic: string, duration: number) {
    learnQuestions = questions;
    learnSetup.classList.add('hidden');
    learnResults.classList.add('hidden');
    learnQuiz.classList.remove('hidden');
    
    // Resume if state exists, otherwise start fresh
    if (pausedLearnState && pausedLearnState.topic === topic) {
        currentQuestionIndex = pausedLearnState.index;
        learnScore = pausedLearnState.score;
        learnTimeRemaining = pausedLearnState.time;
        learnQuestionTimings = pausedLearnState.timings;
        currentQuizRecords = pausedLearnState.records;
        learnInitialDuration = pausedLearnState.initialDuration;
        pausedLearnState = null;
    } else {
        currentQuestionIndex = 0;
        learnScore = 0;
        learnTimeRemaining = duration;
        learnInitialDuration = duration;
        learnQuestionTimings = [];
        currentQuizRecords = [];
    }

    displayLearnQuestion();
    startLearnTimer();
}

function startLearnTimer() {
    clearInterval(learnTimerInterval);
    learnTimer.textContent = `Tempo: ${learnTimeRemaining}`;
    learnTimerInterval = window.setInterval(() => {
        learnTimeRemaining--;
        learnTimer.textContent = `Tempo: ${learnTimeRemaining}`;
        if (learnTimeRemaining <= 0) endLearnQuiz();
    }, 1000);
}

function displayLearnQuestion() {
    if (currentQuestionIndex >= learnQuestions.length) {
        endLearnQuiz();
        return;
    }
    const question = learnQuestions[currentQuestionIndex];
    questionText.textContent = question.question;
    learnProgress.textContent = `Questão: ${currentQuestionIndex + 1}/${learnQuestions.length}`;
    learnAnswerInput.value = '';
    learnAnswerInput.focus();
    learnFeedback.className = 'feedback-message';
    submitLearnAnswerBtn.disabled = false;
    learnAnswerInput.disabled = false;
    learnQuizNav.classList.add('hidden');
    currentQuestionStartTime = Date.now();
    
    // Update nav buttons
    learnPrevBtn.disabled = currentQuestionIndex === 0;
    learnNextBtn.textContent = (currentQuestionIndex === learnQuestions.length - 1) ? 'Finalizar' : 'Próximo →';
}

function nextLearnQuestion() {
    currentQuestionIndex++;
    displayLearnQuestion();
}

function endLearnQuiz() {
    clearInterval(learnTimerInterval);
    learnQuiz.classList.add('hidden');
    learnResults.classList.remove('hidden');

    const score = currentQuizRecords.filter(r => r.isCorrect).length;
    const totalTime = learnInitialDuration - learnTimeRemaining;
    const topic = learnTopicInput.value.trim() || (currentExerciseToSave?.topic ?? '');
    
    saveHistoryItem({
        mode: 'Aprender',
        topic: topic,
        score: `${score}/${learnQuestions.length}`,
        details: { totalTime, timePerQuestion: currentQuizRecords.map(r => r.timeTaken) }
    });
    
    if (isLoggedIn) {
        currentExerciseToSave = {
            mode: 'Aprender',
            topic: topic,
            data: learnQuestions,
        };
    }
    
    endQuizAndGenerateReport('Aprender', topic);
}

function resetLearnMode() {
    learnResults.classList.add('hidden');
    learnQuiz.classList.add('hidden');
    learnSetup.classList.remove('hidden');
    learnTopicInput.value = '';
    learnMessage.textContent = '';
    pausedLearnState = null;
    currentExerciseToSave = null;
}

async function initiateLearnQuiz(count: number, duration: number) {
    const topic = learnTopicInput.value.trim();
    if (!topic) {
        learnMessage.textContent = 'Por favor, insira um tópico.';
        return;
    }
    learnMessage.textContent = `Gerando quiz...`;
    startLearnBtn.disabled = true;
    saveLearnReportBtn.classList.add('hidden');
    saveLearnExerciseBtn.classList.add('hidden');
    currentExerciseToSave = null;

    try {
        const prompt = `Gere um quiz com ${count} questões abertas sobre "${topic}". Forneça a resposta correta e concisa para cada uma. Gere uma resposta JSON com uma chave "questions" contendo uma matriz de objetos, cada um com "question" e "answer".`;
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { responseMimeType: 'application/json' },
        });
        
        const responseData = JSON.parse(result.text.trim());
        if (responseData && responseData.questions && responseData.questions.length >= count) {
            learnQuestions = responseData.questions.slice(0, count);
            learnMessage.textContent = '';
            startLearnQuiz(learnQuestions, topic, duration);
        } else {
            learnMessage.textContent = 'Não foi possível gerar questões suficientes.';
        }
    } catch (error) {
        learnMessage.textContent = 'Ocorreu um erro ao gerar o quiz.';
    } finally {
        startLearnBtn.disabled = false;
    }
}


submitLearnAnswerBtn.addEventListener('click', async () => {
    const userAnswer = learnAnswerInput.value.trim();
    if (!userAnswer) {
        alert('Por favor, digite uma resposta.');
        return;
    }
    submitLearnAnswerBtn.disabled = true;
    learnAnswerInput.disabled = true;
    learnFeedback.textContent = 'Verificando...';
    learnFeedback.className = 'feedback-message visible';
    
    const correctQuestion = learnQuestions[currentQuestionIndex];
    try {
        const prompt = `Avalie se a resposta do aluno está correta. Pergunta: "${correctQuestion.question}". Resposta Correta: "${correctQuestion.answer}". Resposta do Aluno: "${userAnswer}". Gere um JSON com "is_correct": boolean e "feedback": string.`;
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { responseMimeType: 'application/json' },
        });
        const evaluation = JSON.parse(result.text.trim());
        
        learnFeedback.textContent = evaluation.feedback;
        if (evaluation.is_correct) {
            learnScore++;
            learnFeedback.classList.add('correct');
        } else {
            learnFeedback.classList.add('incorrect');
        }

        const record: AnswerRecord = {
            question: correctQuestion,
            userAnswer: userAnswer,
            isCorrect: evaluation.is_correct,
            feedback: evaluation.feedback,
            timeTaken: (Date.now() - currentQuestionStartTime) / 1000
        };
        currentQuizRecords.push(record);

    } catch (error) {
        learnFeedback.textContent = 'Não foi possível avaliar a resposta. Marcando como incorreta.';
        learnFeedback.classList.add('incorrect');
        const record: AnswerRecord = {
            question: correctQuestion,
            userAnswer: userAnswer,
            isCorrect: false,
            feedback: 'Não foi possível avaliar a resposta.',
            timeTaken: (Date.now() - currentQuestionStartTime) / 1000
        };
        currentQuizRecords.push(record);

    } finally {
        learnQuizNav.classList.remove('hidden');
    }
});

learnNextBtn.addEventListener('click', () => {
    if (learnNextBtn.textContent === 'Finalizar') {
        endLearnQuiz();
    } else {
        nextLearnQuestion();
    }
});

learnPrevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayLearnQuestion();
    }
});

playLearnAgainBtn.addEventListener('click', () => startLearnQuiz(learnQuestions, learnTopicInput.value.trim() || currentExerciseToSave?.topic || '', learnInitialDuration));
newLearnQuizBtn.addEventListener('click', resetLearnMode);

// --- Misto Mode Logic ---
function startMistoQuiz(questions: MistoQuestion[], topic: string, duration: number) {
    mistoQuestions = questions;
    mistoSetup.classList.add('hidden');
    mistoResults.classList.add('hidden');
    mistoQuiz.classList.remove('hidden');
    
    if (pausedMistoState && pausedMistoState.topic === topic) {
        currentMistoQuestionIndex = pausedMistoState.index;
        mistoScore = pausedMistoState.score;
        mistoTimeRemaining = pausedMistoState.time;
        mistoQuestionTimings = pausedMistoState.timings;
        currentQuizRecords = pausedMistoState.records;
        mistoInitialDuration = pausedMistoState.initialDuration;
        pausedMistoState = null;
    } else {
        currentMistoQuestionIndex = 0;
        mistoScore = 0;
        mistoTimeRemaining = duration;
        mistoInitialDuration = duration;
        mistoQuestionTimings = [];
        currentQuizRecords = [];
    }

    displayMistoQuestion();
    startMistoTimer();
}

function startMistoTimer() {
    clearInterval(mistoTimerInterval);
    mistoTimer.textContent = `Tempo: ${mistoTimeRemaining}`;
    mistoTimerInterval = window.setInterval(() => {
        mistoTimeRemaining--;
        mistoTimer.textContent = `Tempo: ${mistoTimeRemaining}`;
        if (mistoTimeRemaining <= 0) endMistoQuiz();
    }, 1000);
}

function displayMistoQuestion() {
     if (currentMistoQuestionIndex >= mistoQuestions.length) {
        endMistoQuiz();
        return;
    }
    const question = mistoQuestions[currentMistoQuestionIndex];
    mistoQuestionText.textContent = question.question;
    mistoProgress.textContent = `Questão: ${currentMistoQuestionIndex + 1}/${mistoQuestions.length}`;
    mistoAnswerOptions.innerHTML = '';
    
    switch (question.type) {
        case QuestionType.MULTIPLE_CHOICE:
            shuffle([...(question.options || [])]).forEach(option => {
                mistoAnswerOptions.innerHTML += `<label class="multiple-choice-option"><input type="radio" name="misto-option" value="${option}"> ${option}</label>`;
            });
            break;
        case QuestionType.FILL_IN_BLANK:
            mistoAnswerOptions.innerHTML = `<input type="text" placeholder="Preencha a lacuna">`;
            break;
        case QuestionType.OPEN_ENDED:
            mistoAnswerOptions.innerHTML = `<textarea placeholder="Digite sua resposta..."></textarea>`;
            break;
    }
    
    mistoFeedback.className = 'feedback-message';
    submitMistoAnswerBtn.disabled = false;
    mistoAnswerOptions.querySelectorAll('input, textarea').forEach(el => (el as HTMLElement).removeAttribute('disabled'));
    mistoQuizNav.classList.add('hidden');
    currentMistoQuestionStartTime = Date.now();

    mistoPrevBtn.disabled = currentMistoQuestionIndex === 0;
    mistoNextBtn.textContent = (currentMistoQuestionIndex === mistoQuestions.length - 1) ? 'Finalizar' : 'Próximo →';
}

function nextMistoQuestion() {
    currentMistoQuestionIndex++;
    displayMistoQuestion();
}

function endMistoQuiz() {
    clearInterval(mistoTimerInterval);
    mistoQuiz.classList.add('hidden');
    mistoResults.classList.remove('hidden');

    const score = currentQuizRecords.filter(r => r.isCorrect).length;
    const totalTime = mistoInitialDuration - mistoTimeRemaining;
    const topic = mistoTopicInput.value.trim() || (currentExerciseToSave?.topic ?? '');
    
    saveHistoryItem({
        mode: 'Misto',
        topic: topic,
        score: `${score}/${mistoQuestions.length}`,
        details: { totalTime, timePerQuestion: currentQuizRecords.map(r => r.timeTaken) }
    });

    if (isLoggedIn) {
        currentExerciseToSave = {
            mode: 'Misto',
            topic: topic,
            data: mistoQuestions,
        };
    }

    endQuizAndGenerateReport('Misto', topic);
}

function resetMistoMode() {
    mistoResults.classList.add('hidden');
    mistoQuiz.classList.add('hidden');
    mistoSetup.classList.remove('hidden');
    mistoTopicInput.value = '';
    mistoMessage.textContent = '';
    pausedMistoState = null;
    currentExerciseToSave = null;
}

async function initiateMistoQuiz(count: number, duration: number) {
    const topic = mistoTopicInput.value.trim();
    if (!topic) {
        mistoMessage.textContent = 'Por favor, insira um tópico.';
        return;
    }
    mistoMessage.textContent = `Gerando quiz misto...`;
    startMistoBtn.disabled = true;
    saveMistoReportBtn.classList.add('hidden');
    saveMistoExerciseBtn.classList.add('hidden');
    currentExerciseToSave = null;

    try {
        const prompt = `Gere um quiz misto com ${count} questões sobre "${topic}". Inclua tipos 'MULTIPLE_CHOICE', 'FILL_IN_BLANK' e 'OPEN_ENDED'. Para múltipla escolha, forneça 4 opções. Para preenchimento, use '___'. Gere um JSON com uma chave "questions" contendo uma matriz de objetos com "question", "type", "answer", e "options" (se aplicável).`;
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { responseMimeType: 'application/json' },
        });
        const responseData = JSON.parse(result.text.trim());

        if (responseData && responseData.questions && responseData.questions.length >= count) {
            mistoQuestions = responseData.questions.slice(0, count);
            mistoMessage.textContent = '';
            startMistoQuiz(mistoQuestions, topic, duration);
        } else {
            mistoMessage.textContent = 'Não foi possível gerar questões suficientes.';
        }
    } catch (error) {
        mistoMessage.textContent = 'Ocorreu um erro ao gerar o quiz.';
    } finally {
        startMistoBtn.disabled = false;
    }
}

submitMistoAnswerBtn.addEventListener('click', async () => {
    const question = mistoQuestions[currentMistoQuestionIndex];
    let userAnswer = '';

    switch (question.type) {
        case QuestionType.MULTIPLE_CHOICE:
            const selected = mistoAnswerOptions.querySelector<HTMLInputElement>('input:checked');
            if (!selected) { alert('Selecione uma opção.'); return; }
            userAnswer = selected.value;
            break;
        case QuestionType.FILL_IN_BLANK:
            userAnswer = (mistoAnswerOptions.querySelector('input') as HTMLInputElement).value.trim();
            break;
        case QuestionType.OPEN_ENDED:
            userAnswer = (mistoAnswerOptions.querySelector('textarea') as HTMLTextAreaElement).value.trim();
            break;
    }
    
    if (!userAnswer && question.type !== QuestionType.MULTIPLE_CHOICE) { alert('Digite uma resposta.'); return; }

    submitMistoAnswerBtn.disabled = true;
    mistoAnswerOptions.querySelectorAll('input, textarea').forEach(el => (el as HTMLElement).setAttribute('disabled', 'true'));
    mistoFeedback.textContent = 'Verificando...';
    mistoFeedback.className = 'feedback-message visible';
    
    let isCorrect = false;
    let feedbackText = '';

    if (question.type === QuestionType.OPEN_ENDED) {
        try {
            const prompt = `Avalie a resposta: Pergunta: "${question.question}". Resposta Correta: "${question.answer}". Resposta do Aluno: "${userAnswer}". Gere JSON com "is_correct" e "feedback".`;
            const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
            const evaluation = JSON.parse(result.text.trim());
            isCorrect = evaluation.is_correct;
            feedbackText = evaluation.feedback;
        } catch (error) {
            feedbackText = 'Não foi possível avaliar a resposta.';
        }
    } else {
        isCorrect = userAnswer.toLowerCase() === question.answer.toLowerCase();
        feedbackText = isCorrect ? 'Correto!' : `Incorreto. A resposta é: ${question.answer}`;
    }

    mistoFeedback.textContent = feedbackText;
    if (isCorrect) {
        mistoScore++;
        mistoFeedback.classList.add('correct');
    } else {
        mistoFeedback.classList.add('incorrect');
    }

    const record: AnswerRecord = {
        question: question,
        userAnswer: userAnswer,
        isCorrect: isCorrect,
        feedback: feedbackText,
        timeTaken: (Date.now() - currentMistoQuestionStartTime) / 1000
    };
    currentQuizRecords.push(record);
    
    mistoQuizNav.classList.remove('hidden');
});

mistoNextBtn.addEventListener('click', () => {
    if (mistoNextBtn.textContent === 'Finalizar') {
        endMistoQuiz();
    } else {
        nextMistoQuestion();
    }
});

mistoPrevBtn.addEventListener('click', () => {
    if (currentMistoQuestionIndex > 0) {
        currentMistoQuestionIndex--;
        displayMistoQuestion();
    }
});

playMistoAgainBtn.addEventListener('click', () => startMistoQuiz(mistoQuestions, mistoTopicInput.value.trim() || currentExerciseToSave?.topic || '', mistoInitialDuration));
newMistoQuizBtn.addEventListener('click', resetMistoMode);

// --- Quiz Results Report ---
async function endQuizAndGenerateReport(mode: 'Aprender' | 'Misto', topic: string) {
    const reportContainer = mode === 'Aprender' ? learnReportContainer : mistoReportContainer;
    const saveReportBtn = mode === 'Aprender' ? saveLearnReportBtn : saveMistoReportBtn;
    const saveExerciseBtn = mode === 'Aprender' ? saveLearnExerciseBtn : saveMistoExerciseBtn;

    reportContainer.innerHTML = `<p class="report-loading-message">Gerando seu relatório estatístico completo...</p>`;
    saveReportBtn.classList.add('hidden');
    saveExerciseBtn.classList.add('hidden');

    try {
        const prompt = `
            Você é um tutor especialista criando um relatório de desempenho para um aluno.
            Tópico do quiz: "${topic}"
            Dados do quiz: ${JSON.stringify(currentQuizRecords)}

            Com base nesses dados, gere um relatório detalhado. Responda em JSON usando o seguinte esquema.
            - Para cada questão em 'questionAnalysis', forneça uma explicação clara do porquê a resposta correta é correta, cite uma fonte confiável (URL real e funcional), e estime um tempo ideal em segundos para responder (idealTimeSeconds).
            - Em 'reinforcementTopics', liste os conceitos chave que o aluno errou.
            - Em 'studyMaterials', forneça 2-3 links de materiais de estudo (artigos, vídeos) relevantes para os tópicos que precisam de reforço. Certifique-se que as URLs são reais e funcionais.
        `;
        
        const reportSchema = {
          type: Type.OBJECT,
          properties: {
            questionAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  explanation: { type: Type.STRING, description: "Explicação da resposta correta." },
                  source: { type: Type.STRING, description: "URL de uma fonte confiável." },
                  idealTimeSeconds: { type: Type.NUMBER, description: "Tempo ideal em segundos." }
                },
                required: ['explanation', 'source', 'idealTimeSeconds']
              }
            },
            reinforcementTopics: {
              type: Type.ARRAY,
              description: "Tópicos que o aluno precisa reforçar.",
              items: { type: Type.STRING }
            },
            studyMaterials: {
              type: Type.ARRAY,
              description: "Materiais de estudo sugeridos.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ['title', 'url']
              }
            }
          },
          required: ['questionAnalysis', 'reinforcementTopics', 'studyMaterials']
        };

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: reportSchema },
        });

        const reportData = JSON.parse(result.text.trim());
        const reportHtml = generateQuizReportHtml(reportData, topic);
        reportContainer.innerHTML = reportHtml;
        if(isLoggedIn) {
            saveReportBtn.classList.remove('hidden');
            saveExerciseBtn.classList.remove('hidden');
        }

    } catch (error) {
        reportContainer.innerHTML = `<p>Ocorreu um erro ao gerar o relatório. Tente novamente mais tarde.</p>`;
        console.error("Report generation error:", error);
    }
}

async function endMatchAndGenerateReport(topic: string, timeTaken: number, completed: boolean) {
    matchReportContainer.innerHTML = `<p class="report-loading-message">Gerando seu relatório estatístico completo...</p>`;
    saveMatchReportBtn.classList.add('hidden');
    saveMatchExerciseBtn.classList.add('hidden');

    try {
        const prompt = `
            Você é um tutor especialista criando um relatório de desempenho para um aluno que completou um jogo de combinação.
            Tópico do jogo: "${topic}"
            Pares no jogo: ${JSON.stringify(matchCards)}
            Tempo total do jogador: ${timeTaken} segundos.
            Status: ${completed ? 'Completou com sucesso' : 'Tempo esgotado'}

            Com base nesses dados, gere um relatório de análise. Responda em JSON usando o seguinte esquema.
            - Em 'performanceSummary', comente sobre o tempo do jogador.
            - Em 'topicAnalysis', analise os pares de termos e descreva brevemente a relação entre eles ou agrupe-os.
            - Em 'studyMaterials', forneça 2-3 links de materiais de estudo (artigos, vídeos) relevantes para o tópico. Certifique-se que as URLs são reais e funcionais.
        `;
        
        const reportSchema = {
          type: Type.OBJECT,
          properties: {
            performanceSummary: { type: Type.STRING, description: "Comentário sobre o desempenho de tempo." },
            topicAnalysis: { type: Type.STRING, description: "Análise dos termos e suas relações." },
            studyMaterials: {
              type: Type.ARRAY,
              description: "Materiais de estudo sugeridos.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ['title', 'url']
              }
            }
          },
          required: ['performanceSummary', 'topicAnalysis', 'studyMaterials']
        };

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: reportSchema },
        });

        const reportData = JSON.parse(result.text.trim());
        const reportHtml = generateMatchReportHtml(reportData, topic, timeTaken, completed);
        matchReportContainer.innerHTML = reportHtml;
        
        if(isLoggedIn) {
            if (completed) saveMatchExerciseBtn.classList.remove('hidden');
            saveMatchReportBtn.classList.remove('hidden');
        }

    } catch (error) {
        matchReportContainer.innerHTML = `<p>Ocorreu um erro ao gerar o relatório. Tente novamente mais tarde.</p>`;
        console.error("Match Report generation error:", error);
    }
}


function generateQuizReportHtml(reportData: any, topic: string): string {
    let html = `<h2>Relatório Estatístico Completo</h2>`;
    html += `<p class="report-topic">Tópico: ${topic}</p>`;
    html += `<h3>Análise das Questões</h3>`;
    
    currentQuizRecords.forEach((record, index) => {
        const analysis = reportData.questionAnalysis?.[index];
        html += `
            <div class="report-question-card ${record.isCorrect ? 'correct' : 'incorrect'}">
                <div class="report-question-header">
                    <strong>Questão ${index + 1}: ${record.isCorrect ? 'Correta' : 'Incorreta'}</strong>
                    <span>Seu tempo: ${record.timeTaken.toFixed(1)}s / Ideal: ${analysis?.idealTimeSeconds ? `${analysis.idealTimeSeconds}s` : 'N/A'}</span>
                </div>
                <p class="report-question-text speech-text-wrapper">
                    <strong class="text-to-speak">P: ${record.question.question}</strong>
                    <button class="speech-btn" title="Ouvir pergunta">${SPEECH_ICON_SVG}</button>
                </p>
                <p class="speech-text-wrapper">
                    <span class="text-to-speak"><strong>Sua resposta:</strong> ${record.userAnswer || '<i>Não respondida</i>'}</span>
                     <button class="speech-btn" title="Ouvir sua resposta">${SPEECH_ICON_SVG}</button>
                </p>
                ${!record.isCorrect ? `<p class="speech-text-wrapper"><span class="text-to-speak"><strong>Resposta correta:</strong> ${record.question.answer}</span> <button class="speech-btn" title="Ouvir resposta correta">${SPEECH_ICON_SVG}</button></p>` : ''}
                <div class="report-explanation">
                    <h4>Explicação</h4>
                    ${analysis ? `
                    <p class="speech-text-wrapper">
                        <span class="text-to-speak">${analysis.explanation}</span>
                        <button class="speech-btn" title="Ouvir explicação">${SPEECH_ICON_SVG}</button>
                    </p>
                    <p><small>Fonte: <a href="${analysis.source}" target="_blank" rel="noopener noreferrer">${analysis.source}</a></small></p>
                    ` : `<p>Análise da IA indisponível para esta questão.</p>`}
                </div>
            </div>
        `;
    });

    html += `<h3>Pontos a Reforçar</h3>`;
    if (reportData.reinforcementTopics && reportData.reinforcementTopics.length > 0) {
        html += `<ul class="report-summary-list">${reportData.reinforcementTopics.map((t: string) => `<li><div class="speech-text-wrapper"><span class="text-to-speak">${t}</span><button class="speech-btn" title="Ouvir tópico">${SPEECH_ICON_SVG}</button></div></li>`).join('')}</ul>`;
    } else {
        html += `<p>Parabéns! Você demonstrou um bom domínio do conteúdo.</p>`;
    }

    html += `<h3>Materiais de Estudo Sugeridos</h3>`;
     if (reportData.studyMaterials && reportData.studyMaterials.length > 0) {
        html += `<ul class="report-summary-list">${reportData.studyMaterials.map((m: any) => `<li><a href="${m.url}" target="_blank" rel="noopener noreferrer">${m.title}</a></li>`).join('')}</ul>`;
    } else {
        html += `<p>Nenhum material adicional necessário no momento.</p>`;
    }

    return html;
}

function generateMatchReportHtml(reportData: any, topic: string, timeTaken: number, completed: boolean): string {
    let html = `<h2>Relatório Estatístico Completo</h2>`;
    html += `<p class="report-topic">Tópico: ${topic}</p>`;
    
    html += `<h3>Resumo do Desempenho</h3>`;
    html += `<p><strong>Status:</strong> ${completed ? `Completou com sucesso em ${timeTaken} segundos.` : `Tempo esgotado!`}</p>`;
    html += `<p class="speech-text-wrapper"><span class="text-to-speak">${reportData.performanceSummary}</span><button class="speech-btn" title="Ouvir resumo">${SPEECH_ICON_SVG}</button></p>`;
    
    html += `<h3>Análise do Tópico</h3>`;
    html += `<p class="speech-text-wrapper"><span class="text-to-speak">${reportData.topicAnalysis}</span><button class="speech-btn" title="Ouvir análise">${SPEECH_ICON_SVG}</button></p>`;

    html += `<h3>Materiais de Estudo Sugeridos</h3>`;
    if (reportData.studyMaterials && reportData.studyMaterials.length > 0) {
        html += `<ul class="report-summary-list">${reportData.studyMaterials.map((m: any) => `<li><a href="${m.url}" target="_blank" rel="noopener noreferrer">${m.title}</a></li>`).join('')}</ul>`;
    } else {
        html += `<p>Nenhum material adicional necessário no momento.</p>`;
    }

    return html;
}

[saveLearnReportBtn, saveMistoReportBtn, saveMatchReportBtn].forEach(btn => {
    btn.addEventListener('click', () => {
        if (!activeStudyView || !['learn', 'misto', 'match'].includes(activeStudyView)) return;

        const reportContainer = document.getElementById(`${activeStudyView}ReportContainer`);
        const topicInputEl = document.getElementById(`${activeStudyView}TopicInput`) as HTMLInputElement;
        
        const topic = topicInputEl?.value.trim() || currentExerciseToSave?.topic;

        if (!reportContainer || !topic) return;

        const reportMode = activeStudyView === 'learn' ? 'Aprender' : activeStudyView === 'misto' ? 'Misto' : 'Combinar';
        
        // Clone the content and remove speech buttons for a cleaner saved version
        const cleanReportContainer = reportContainer.cloneNode(true) as HTMLElement;
        cleanReportContainer.querySelectorAll('.speech-btn').forEach(btn => btn.remove());

        const newReport: SavedReport = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            topic: topic,
            mode: reportMode,
            content: cleanReportContainer.innerHTML,
        };
        userReports.unshift(newReport);
        saveLibraryToStorage();
        alert('Relatório salvo na sua biblioteca!');
        btn.classList.add('hidden');
    });
});

[saveLearnExerciseBtn, saveMistoExerciseBtn, saveMatchExerciseBtn].forEach(btn => {
    btn.addEventListener('click', () => {
        openSaveExerciseModal();
        btn.classList.add('hidden');
    });
});


// --- Exercise Configuration ---
function openConfigModal(mode: ActiveConfigMode) {
    activeConfigMode = mode;
    if (mode === 'match') {
        configItemCountInput.value = '6';
        configTimeLimitInput.value = '2';
    } else {
        configItemCountInput.value = '5';
        configTimeLimitInput.value = '2';
    }
    exerciseConfigModal.classList.remove('hidden');
}

function openSaveExerciseModal() {
    if (!currentExerciseToSave) {
        alert("Nenhum exercício para salvar.");
        return;
    }
    // Prefill the input with the topic
    exerciseFolderNameInput.value = `Exercício: ${currentExerciseToSave.topic}`;
    saveExerciseModal.classList.remove('hidden');
}

closeExerciseConfigModalBtn.addEventListener('click', () => exerciseConfigModal.classList.add('hidden'));

exerciseConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeConfigMode) return;
    
    const itemCount = parseInt(configItemCountInput.value);
    const timeLimitInMinutes = parseInt(configTimeLimitInput.value);
    const timeLimitInSeconds = timeLimitInMinutes * 60;

    const mode = activeConfigMode;
    const topicInputEl = (
        mode === 'learn' ? learnTopicInput :
        mode === 'misto' ? mistoTopicInput :
        matchTopicInput
    );

    lastExerciseConfig = {
        count: itemCount,
        duration: timeLimitInSeconds,
        topic: topicInputEl.value.trim()
    };

    exerciseConfigModal.classList.add('hidden');
    activeConfigMode = null;

    switch (mode) {
        case 'learn':
            await initiateLearnQuiz(itemCount, timeLimitInSeconds);
            break;
        case 'misto':
            await initiateMistoQuiz(itemCount, timeLimitInSeconds);
            break;
        case 'match':
            await initiateMatchGame(itemCount, timeLimitInSeconds);
            break;
    }
});


[startLearnBtn, startMistoBtn, startGameBtn].forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = (btn as HTMLElement).dataset.mode as ActiveConfigMode;
        openConfigModal(mode);
    });
});


// --- Pause/Exit & Resume Modal Logic ---
closePauseExitModalBtn.addEventListener('click', () => pauseExitModal.classList.add('hidden'));

pauseBtn.addEventListener('click', () => {
    clearInterval(learnTimerInterval);
    clearInterval(mistoTimerInterval);
    clearInterval(matchTimerInterval);

    switch(activeStudyView) {
        case 'learn':
            pausedLearnState = {
                questions: learnQuestions,
                topic: learnTopicInput.value.trim() || currentExerciseToSave?.topic || '',
                index: currentQuestionIndex,
                score: learnScore,
                time: learnTimeRemaining,
                timings: learnQuestionTimings,
                records: currentQuizRecords,
                initialDuration: learnInitialDuration,
            };
            break;
        case 'misto':
             pausedMistoState = {
                questions: mistoQuestions,
                topic: mistoTopicInput.value.trim() || currentExerciseToSave?.topic || '',
                index: currentMistoQuestionIndex,
                score: mistoScore,
                time: mistoTimeRemaining,
                timings: mistoQuestionTimings,
                records: currentQuizRecords,
                initialDuration: mistoInitialDuration,
            };
            break;
        case 'match':
             pausedMatchState = {
                cards: matchCards,
                topic: matchTopicInput.value.trim() || currentExerciseToSave?.topic || '',
                time: matchTimeRemaining,
                matchedTerms: Array.from(termsContainer.querySelectorAll('.matched')).map(el => (el as HTMLElement).dataset.term || ''),
                matchedDefs: Array.from(definitionsContainer.querySelectorAll('.matched')).map(el => (el as HTMLElement).dataset.definition || ''),
                initialDuration: matchInitialDuration,
            };
            break;
    }
    
    pauseExitModal.classList.add('hidden');
    showMainView('home');
});

giveUpBtn.addEventListener('click', () => {
     switch(activeStudyView) {
        case 'learn': resetLearnMode(); break;
        case 'misto': resetMistoMode(); break;
        case 'match': resetMatchMode(); break;
    }
    pauseExitModal.classList.add('hidden');
    showMainView('home');
});

regenerateBtn.addEventListener('click', async () => {
    if (!lastExerciseConfig) {
        alert("Nenhuma configuração anterior encontrada para gerar novamente.");
        return;
    }
    pauseExitModal.classList.add('hidden');
    switch (activeStudyView) {
        case 'learn':
            learnTopicInput.value = lastExerciseConfig.topic;
            await initiateLearnQuiz(lastExerciseConfig.count, lastExerciseConfig.duration);
            break;
        case 'misto':
            mistoTopicInput.value = lastExerciseConfig.topic;
            await initiateMistoQuiz(lastExerciseConfig.count, lastExerciseConfig.duration);
            break;
        case 'match':
            matchTopicInput.value = lastExerciseConfig.topic;
            await initiateMatchGame(lastExerciseConfig.count, lastExerciseConfig.duration);
            break;
    }
});

// Resume Modal Logic
closeResumeExerciseModalBtn.addEventListener('click', () => resumeExerciseModal.classList.add('hidden'));

resumeBtn.addEventListener('click', () => {
    resumeExerciseModal.classList.add('hidden');
    if (!activeStudyView) return;
    
    if (activeStudyView === 'learn' && pausedLearnState) {
        startLearnQuiz(pausedLearnState.questions, pausedLearnState.topic, pausedLearnState.time);
    } else if (activeStudyView === 'misto' && pausedMistoState) {
        startMistoQuiz(pausedMistoState.questions, pausedMistoState.topic, pausedMistoState.time);
    } else if (activeStudyView === 'match' && pausedMatchState) {
        matchInitialDuration = pausedMatchState.initialDuration;
        matchCards = pausedMatchState.cards;
        setupMatchGame(pausedMatchState.cards, pausedMatchState.time, pausedMatchState.matchedTerms, pausedMatchState.matchedDefs);
    }
});

regenerateFromPauseBtn.addEventListener('click', async () => {
    resumeExerciseModal.classList.add('hidden');
    let config: { count: number, duration: number, topic: string } | null = null;
    
    if (activeStudyView === 'learn' && pausedLearnState) {
        config = { count: pausedLearnState.questions.length, duration: pausedLearnState.initialDuration, topic: pausedLearnState.topic };
        learnTopicInput.value = config.topic;
        await initiateLearnQuiz(config.count, config.duration);
    } else if (activeStudyView === 'misto' && pausedMistoState) {
        config = { count: pausedMistoState.questions.length, duration: pausedMistoState.initialDuration, topic: pausedMistoState.topic };
        mistoTopicInput.value = config.topic;
        await initiateMistoQuiz(config.count, config.duration);
    } else if (activeStudyView === 'match' && pausedMatchState) {
        config = { count: pausedMatchState.cards.length, duration: pausedMatchState.initialDuration, topic: pausedMatchState.topic };
        matchTopicInput.value = config.topic;
        await initiateMatchGame(config.count, config.duration);
    }
    
    pausedLearnState = null;
    pausedMistoState = null;
    pausedMatchState = null;
});

giveUpFromPauseBtn.addEventListener('click', () => {
    resumeExerciseModal.classList.add('hidden');
    if (activeStudyView === 'learn') resetLearnMode();
    if (activeStudyView === 'misto') resetMistoMode();
    if (activeStudyView === 'match') resetMatchMode();
});


// Save Exercise Modal Logic
closeSaveExerciseModalBtn.addEventListener('click', () => saveExerciseModal.classList.add('hidden'));

saveExerciseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentExerciseToSave || !isLoggedIn) return;

    const name = exerciseFolderNameInput.value.trim();
    if (!name) {
        alert('Por favor, insira um nome para a pasta do exercício.');
        return;
    }

    const newExercise: SavedExercise = {
        ...currentExerciseToSave,
        id: Date.now().toString(),
        name: name,
    };

    userExercises.unshift(newExercise);
    saveLibraryToStorage();
    
    alert(`Exercício "${name}" salvo na sua biblioteca!`);
    saveExerciseModal.classList.add('hidden');
    saveExerciseForm.reset();
    currentExerciseToSave = null;
});


// Card Viewer Modal Logic
closeCardViewerModalBtn.addEventListener('click', () => {
    cardViewerModal.classList.add('hidden');
    currentCardSetInViewer = null; // Clear the state
});

cardViewerPrevBtn.addEventListener('click', () => {
    if (currentCardViewerIndex > 0) {
        currentCardViewerIndex--;
        renderCardInViewer();
    }
});

cardViewerNextBtn.addEventListener('click', () => {
    if (currentCardSetInViewer && currentCardViewerIndex < currentCardSetInViewer.cards.length - 1) {
        currentCardViewerIndex++;
        renderCardInViewer();
    }
});


// Exit Unsaved Modals Logic
closeExitUnsavedModalBtn.addEventListener('click', () => exitUnsavedModal.classList.add('hidden'));

exitAndDiscardBtn.addEventListener('click', () => {
    exitUnsavedModal.classList.add('hidden');
    
    // Reset the specific view state
    switch(activeStudyView) {
        case 'learn': resetLearnMode(); break;
        case 'misto': resetMistoMode(); break;
        case 'match': resetMatchMode(); break;
        case 'flashcards':
            currentGeneratedCards = [];
            flashcardsContainer.innerHTML = '';
            topicInput.value = '';
            saveFlashcardsBtn.classList.add('hidden');
            viewGeneratedCardsBtn.classList.add('hidden');
            break;
        case 'guided':
            currentSolutionData = null;
            solutionContainer.innerHTML = '';
            solutionContainer.classList.remove('visible');
            problemInput.value = '';
            saveSolutionBtn.classList.add('hidden');
            attachedFile = null;
            filePreviewArea.classList.add('hidden');
            break;
    }
    
    showMainView('home');
});

backAndKeepBtn.addEventListener('click', () => {
    exitUnsavedModal.classList.add('hidden');
    if (activeStudyView === 'flashcards') {
         pausedFlashcardState = {
            cards: currentGeneratedCards,
            topic: topicInput.value.trim(),
        };
    } else if (activeStudyView === 'guided') {
        pausedSolutionState = {
            solution: currentSolutionData!,
            topic: problemInput.value.trim(),
        };
    } else if (activeStudyView && ['learn', 'misto', 'match'].includes(activeStudyView)) {
        const reportContainer = document.getElementById(`${activeStudyView}ReportContainer`);
        const topicInputEl = document.getElementById(`${activeStudyView}TopicInput`) as HTMLInputElement;
        
        pausedReportState = {
            mode: activeStudyView === 'learn' ? 'Aprender' : activeStudyView === 'misto' ? 'Misto' : 'Combinar',
            topic: topicInputEl.value.trim() || currentExerciseToSave?.topic || '',
            reportHtml: reportContainer?.innerHTML || '',
            exerciseToSave: currentExerciseToSave,
        };
    }
    
    showMainView('home');
});

// App-wide Text-to-Speech
document.addEventListener('click', (e) => {
    const speechBtn = (e.target as HTMLElement).closest('.speech-btn');
    if (speechBtn) {
        const wrapper = speechBtn.closest('.speech-text-wrapper');
        const textEl = wrapper?.querySelector('.text-to-speak');
        if (textEl) {
            const textToSpeak = textEl.textContent || '';
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'pt-BR';
            window.speechSynthesis.speak(utterance);
        }
    }
});


//--- All Actions Modals Listeners ---//
[closeCardActionsModalBtn, closeSolutionActionsModalBtn, closeExerciseActionsModalBtn, closeReportActionsModalBtn, closeConfirmDeleteModalBtn, closeHistoryReportModalBtn].forEach(btn => {
    btn.addEventListener('click', () => (btn.closest('.modal-overlay') as HTMLElement).classList.add('hidden'));
});

cancelDeleteBtn.addEventListener('click', () => confirmDeleteModal.classList.add('hidden'));

confirmDeleteBtn.addEventListener('click', () => {
    if (!activeItemType || !activeItemId) return;
    
    switch(activeItemType) {
        case 'solution': userSolutions = userSolutions.filter(i => i.id !== activeItemId); break;
        case 'cardSet': userFlashcardSets = userFlashcardSets.filter(i => i.id !== activeItemId); break;
        case 'exercise': userExercises = userExercises.filter(i => i.id !== activeItemId); break;
        case 'report': userReports = userReports.filter(i => i.id !== activeItemId); break;
        case 'account': handleDeleteAccount(); confirmDeleteModal.classList.add('hidden'); return;
    }
    
    saveLibraryToStorage();
    renderLibraryContent();
    confirmDeleteModal.classList.add('hidden');
});

// Card Actions
actionViewCards.addEventListener('click', () => {
    const cardSet = userFlashcardSets.find(cs => cs.id === activeItemId);
    if (cardSet) {
        currentCardSetInViewer = cardSet;
        currentCardViewerIndex = 0;
        renderCardInViewer();
        closeAllModals();
        cardViewerModal.classList.remove('hidden');
    }
});
actionEditCards.addEventListener('click', () => {
    const cardSet = userFlashcardSets.find(cs => cs.id === activeItemId);
    if (!cardSet) return;
    
    editCardSetNameInput.value = cardSet.name;
    editCardSetList.innerHTML = cardSet.cards.map((card, index) => `
        <div class="editable-item" data-index="${index}">
            <div class="editable-item-inputs">
                <input type="text" placeholder="Termo" value="${card.term}">
                <textarea placeholder="Definição">${card.definition}</textarea>
            </div>
            <button type="button" class="delete-item-btn">&times;</button>
        </div>
    `).join('');

    closeAllModals();
    editCardSetModal.classList.remove('hidden');
});
actionDeleteCards.addEventListener('click', () => {
    confirmDeleteTitle.textContent = 'Excluir Conjunto de Cartões';
    confirmDeleteText.textContent = 'Tem certeza que deseja excluir este conjunto de cartões?';
    closeAllModals();
    confirmDeleteModal.classList.remove('hidden');
});

// Solution Actions
actionViewSolution.addEventListener('click', () => {
    const solution = userSolutions.find(s => s.id === activeItemId);
    if (!solution) return;
    
    if (solution.markdownContent) {
        solutionDetailContent.innerHTML = marked.parse(solution.markdownContent) as string;
    } else {
        renderSolution(solution, solutionDetailContent);
    }
    
    // Reset to viewer mode
    solutionDetailViewer.classList.remove('hidden');
    solutionDetailEditor.classList.add('hidden');

    closeAllModals();
    solutionDetailModal.classList.remove('hidden');
});
actionDeleteSolution.addEventListener('click', () => {
    confirmDeleteTitle.textContent = 'Excluir Solução';
    confirmDeleteText.textContent = 'Tem certeza que deseja excluir esta solução?';
    closeAllModals();
    confirmDeleteModal.classList.remove('hidden');
});

// Report Actions
actionViewReport.addEventListener('click', () => {
    const report = userReports.find(r => r.id === activeItemId);
    if (report) {
        reportViewerContent.innerHTML = report.content;
        closeAllModals();
        reportViewerModal.classList.remove('hidden');
    }
});
actionDeleteReport.addEventListener('click', () => {
    confirmDeleteTitle.textContent = 'Excluir Relatório';
    confirmDeleteText.textContent = 'Tem certeza que deseja excluir este relatório?';
    closeAllModals();
    confirmDeleteModal.classList.remove('hidden');
});

// Exercise Actions
actionPlayAgain.addEventListener('click', async () => {
    const exercise = userExercises.find(ex => ex.id === activeItemId);
    if (!exercise) return;
    
    closeAllModals();
    showStudyView(exercise.mode.toLowerCase() as StudyView);
    
    // Use default config, but with saved data
    const duration = 120; // Default time
    lastExerciseConfig = { count: exercise.data.length, duration, topic: exercise.topic };

    switch(exercise.mode) {
        case 'Aprender':
            learnTopicInput.value = exercise.topic;
            startLearnQuiz(exercise.data as QuizQuestion[], exercise.topic, duration);
            break;
        case 'Misto':
            mistoTopicInput.value = exercise.topic;
            startMistoQuiz(exercise.data as MistoQuestion[], exercise.topic, duration);
            break;
        case 'Combinar':
            matchTopicInput.value = exercise.topic;
            matchCards = exercise.data as Flashcard[];
            matchInitialDuration = duration;
            setupMatchGame(matchCards, duration);
            break;
    }
});
actionEditExercise.addEventListener('click', () => {
    const exercise = userExercises.find(ex => ex.id === activeItemId);
    if (!exercise) return;
    
    editExerciseNameInput.value = exercise.name;
    editExerciseContent.innerHTML = ''; // Clear previous
    editExerciseContent.dataset.mode = exercise.mode;

    (exercise.data as any[]).forEach((item, index) => {
        editExerciseContent.appendChild(createEditableExerciseItem(item, exercise.mode, index));
    });
    
    closeAllModals();
    editExerciseModal.classList.remove('hidden');
});
actionDeleteExercise.addEventListener('click', () => {
    confirmDeleteTitle.textContent = 'Excluir Exercício';
    confirmDeleteText.textContent = 'Tem certeza que deseja excluir este exercício?';
    closeAllModals();
    confirmDeleteModal.classList.remove('hidden');
});

function createEditableExerciseItem(item: any, mode: string, index: number): HTMLElement {
    const div = document.createElement('div');
    div.className = 'editable-item';
    div.dataset.index = index.toString();
    
    let innerHTML = '<button type="button" class="delete-item-btn" style="float:right">&times;</button><div class="editable-item-inputs">';

    if (mode === 'Aprender') {
        innerHTML += `
            <label>Pergunta</label>
            <textarea class="edit-question">${item.question || ''}</textarea>
            <label>Resposta</label>
            <textarea class="edit-answer">${item.answer || ''}</textarea>
        `;
    } else if (mode === 'Combinar') {
        innerHTML += `
            <label>Termo</label>
            <input type="text" class="edit-term" value="${item.term || ''}">
            <label>Definição</label>
            <textarea class="edit-definition">${item.definition || ''}</textarea>
        `;
    } else if (mode === 'Misto') {
        const type = item.type || 'OPEN_ENDED';
        const options = item.options ? item.options.join(', ') : '';
        innerHTML += `
            <label>Tipo</label>
            <select class="edit-type-select">
                <option value="OPEN_ENDED" ${type === 'OPEN_ENDED' ? 'selected' : ''}>Aberta</option>
                <option value="MULTIPLE_CHOICE" ${type === 'MULTIPLE_CHOICE' ? 'selected' : ''}>Múltipla Escolha</option>
                <option value="FILL_IN_BLANK" ${type === 'FILL_IN_BLANK' ? 'selected' : ''}>Preencher Lacuna</option>
            </select>
            <label>Pergunta</label>
            <textarea class="edit-question">${item.question || ''}</textarea>
            <div class="edit-options-container ${type !== 'MULTIPLE_CHOICE' ? 'hidden' : ''}">
                <label>Opções (separadas por vírgula)</label>
                <input type="text" class="edit-options" value="${options}">
            </div>
            <label>Resposta</label>
            <textarea class="edit-answer">${item.answer || ''}</textarea>
        `;
    }
    innerHTML += '</div>';
    div.innerHTML = innerHTML;

    div.querySelector('.delete-item-btn')?.addEventListener('click', () => div.remove());
    
    if (mode === 'Misto') {
        const select = div.querySelector('.edit-type-select') as HTMLSelectElement;
        const optionsContainer = div.querySelector('.edit-options-container') as HTMLElement;
        if (select && optionsContainer) {
            select.addEventListener('change', () => {
                optionsContainer.classList.toggle('hidden', select.value !== 'MULTIPLE_CHOICE');
            });
        }
    }

    return div;
}

addNewExerciseItemBtn.addEventListener('click', () => {
    const mode = editExerciseContent.dataset.mode;
    if (!mode) return;
    const newItem = mode === 'Combinar' ? { term: '', definition: '' } : { question: '', answer: '' };
    editExerciseContent.appendChild(createEditableExerciseItem(newItem, mode, -1));
});

closeEditExerciseModalBtn.addEventListener('click', () => editExerciseModal.classList.add('hidden'));

editExerciseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!activeItemId) return;
    const exercise = userExercises.find(ex => ex.id === activeItemId);
    if (!exercise) return;

    exercise.name = editExerciseNameInput.value;
    const newItems: any[] = [];
    
    editExerciseContent.querySelectorAll('.editable-item').forEach(el => {
        if (exercise.mode === 'Aprender') {
            const q = (el.querySelector('.edit-question') as HTMLTextAreaElement).value;
            const a = (el.querySelector('.edit-answer') as HTMLTextAreaElement).value;
            if (q && a) newItems.push({ question: q, answer: a });
        } else if (exercise.mode === 'Combinar') {
            const t = (el.querySelector('.edit-term') as HTMLInputElement).value;
            const d = (el.querySelector('.edit-definition') as HTMLTextAreaElement).value;
            if (t && d) newItems.push({ term: t, definition: d });
        } else if (exercise.mode === 'Misto') {
            const type = (el.querySelector('.edit-type-select') as HTMLSelectElement).value;
            const q = (el.querySelector('.edit-question') as HTMLTextAreaElement).value;
            const a = (el.querySelector('.edit-answer') as HTMLTextAreaElement).value;
            const opts = (el.querySelector('.edit-options') as HTMLInputElement)?.value;
            if (q && a) {
                const item: any = { question: q, answer: a, type };
                if (type === 'MULTIPLE_CHOICE' && opts) {
                    item.options = opts.split(',').map(s => s.trim()).filter(Boolean);
                }
                newItems.push(item);
            }
        }
    });
    
    exercise.data = newItems;
    saveLibraryToStorage();
    renderLibraryContent();
    editExerciseModal.classList.add('hidden');
});

// --- Editor Modals --- //
// Save Flashcards Modal
closeSaveFlashcardsModalBtn.addEventListener('click', () => saveFlashcardsModal.classList.add('hidden'));
saveFlashcardsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = flashcardFolderNameInput.value.trim();
    if (!name) { alert('Por favor, insira um nome para a pasta.'); return; }

    const selectedCards: Flashcard[] = [];
    selectableCardList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked').forEach(checkbox => {
        const index = parseInt(checkbox.dataset.index || '-1');
        if (index > -1 && currentGeneratedCards[index]) {
            selectedCards.push(currentGeneratedCards[index]);
        }
    });

    if (!selectedCards.length) { alert('Selecione ao menos um cartão para salvar.'); return; }
    
    const newSet: SavedFlashcardSet = {
        id: Date.now().toString(),
        name,
        cards: selectedCards
    };
    userFlashcardSets.unshift(newSet);
    saveLibraryToStorage();
    renderLibraryContent();
    saveFlashcardsModal.classList.add('hidden');
});