import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './Components/ErrorBoundary/ErrorBoundary';
import { NavyFederalProvider } from './Context/NavyFederalContext';
import { BankingProvider } from './Context/DashboardContext';
import { TransferProvider } from './Context/TransferContext';
import { BudgetingProvider } from './Context/BudgetingContext';

// Import withPreLoader HOC
import withPreLoader from './Components/PreLoader/withPreLoader';

// Import ScrollToTop component
import ScrollToTop from './Components/ScrollToTop/ScrollToTop';

// Import Components
import Login from './Components/Login/Login';
import Register from './Components/Register/Register';
import PasswordReset from './Components/PasswordReset/PasswordReset';
import TransactionHistory from './Components/TransactionHistory/TransactionHistory';
import AccountSettings from './Components/AccountSettings/AccountSettings';
import FundTransfer from './Components/FundTransfer/FundTransfer';
import BillPayment from './Components/BillPayment/BillPayment';
import TransactionConfirmation from './Components/TransactionConfirm/TransactionConfirmation';
import ExpenseTracker from './Components/ExpenseTracker/ExpenseTracker';
import FinancialGoals from './Components/FinancialGoals/FinancialGoals';
import BudgetAnalytics from './Components/BudgetAnalytics/BudgetAnalytics';
import Navbar from './Components/Navbar/Navbar';
import FinancialSummaryPage from './Components/FinancialSummary/FinancialSummaryPage';
import SecurityPage from './Components/Security/SecurityPage';
import HomePage from './Components/HomePage/HomePage';
import AccountPage from './Components/AccountPage/AccountPage';
import BudgetingPage from './Components/Budgeting/BudgetingPage';
import UserProfile from './Components/UserProfile/ProfilePage';
import AdminDashboard from './Components/AdminDashboard/AdminDashboard';
import ModeratorDashboard from './Components/ModeratorDashboard/ModeratorDashboard';

// Import ProtectedRoute
import ProtectedRoute from './security/ProtectedRoute';
import AddAccountForm from './Components/AddAccountForm/AddAccountForm';
import AccountDetailsPage from './Components/AccountDetailsPage/AccountDetailsPage';
import Footer from './Components/Footer/Footer';
import NavyFederalFAQ from './Components/NavyFederalFAQ/NavyFederalFAQ';
import HelpCenter from './Components/HelpCenter/HelpCenter';
import ATMLocator from './Components/ATMLocator/ATMLocator';
import BranchLocator from './Components/BranchLocator/BranchLocator';
import MobileBanking from './Components/MobileBanking/MobileBanking';
import LoanCalculator from './Components/LoanCalculator/LoanCalculator';
import FinancialEducation from './Components/FinancialEducation/FinancialEducation';
import AboutUs from './Components/AboutUs/AboutUs';
import CommunitySupport from './Components/CommunitySupport/CommunitySupport';
import SecurityCenter from './Components/SecurityCenter/SecurityCenter';
import CareerPage from './Components/CareerPage/CareerPage';
import NewsroomPage from './Components/Newsroom/NewsroomPage';
import ContactInformationPage from './Components/ContactInformation/ContactInformationPage';
import TransactionReceipt from './Components/TransactionReceipt/TransactionReceipt';

// Define navigation and refresh times
const NAVIGATION_TIME = 1000;
const REFRESH_TIME = 300;

// Wrap components with preloader HOC
const LoginWithPreloader = withPreLoader(Login, NAVIGATION_TIME, REFRESH_TIME);
const RegisterWithPreloader = withPreLoader(Register, NAVIGATION_TIME, REFRESH_TIME);
const PasswordResetWithPreloader = withPreLoader(PasswordReset, NAVIGATION_TIME, REFRESH_TIME);
const HomePageWithPreloader = withPreLoader(HomePage, NAVIGATION_TIME, REFRESH_TIME);
const TransactionReceiptWithPreloader = withPreLoader(TransactionReceipt, NAVIGATION_TIME, REFRESH_TIME);
const AccountPageWithPreloader = withPreLoader(AccountPage, NAVIGATION_TIME, REFRESH_TIME);
const TransactionHistoryWithPreloader = withPreLoader(TransactionHistory, NAVIGATION_TIME, REFRESH_TIME);
const AccountSettingsWithPreloader = withPreLoader(AccountSettings, NAVIGATION_TIME, REFRESH_TIME);
const FundTransferWithPreloader = withPreLoader(FundTransfer, NAVIGATION_TIME, REFRESH_TIME);
const BillPaymentWithPreloader = withPreLoader(BillPayment, NAVIGATION_TIME, REFRESH_TIME);
const TransactionConfirmationWithPreloader = withPreLoader(TransactionConfirmation, NAVIGATION_TIME, REFRESH_TIME);
const ExpenseTrackerWithPreloader = withPreLoader(ExpenseTracker, NAVIGATION_TIME, REFRESH_TIME);
const FinancialGoalsWithPreloader = withPreLoader(FinancialGoals, NAVIGATION_TIME, REFRESH_TIME);
const BudgetAnalyticsWithPreloader = withPreLoader(BudgetAnalytics, NAVIGATION_TIME, REFRESH_TIME);
const FinancialSummaryPageWithPreloader = withPreLoader(FinancialSummaryPage, NAVIGATION_TIME, REFRESH_TIME);
const SecurityPageWithPreloader = withPreLoader(SecurityPage, NAVIGATION_TIME, REFRESH_TIME);
const BudgetingPageWithPreloader = withPreLoader(BudgetingPage, NAVIGATION_TIME, REFRESH_TIME);
const UserProfileWithPreloader = withPreLoader(UserProfile, NAVIGATION_TIME, REFRESH_TIME);
const AdminDashboardWithPreloader = withPreLoader(AdminDashboard, NAVIGATION_TIME, REFRESH_TIME);
const ModeratorDashboardWithPreloader = withPreLoader(ModeratorDashboard, NAVIGATION_TIME, REFRESH_TIME);

function App() {
  return (
    <ErrorBoundary>
      <NavyFederalProvider>
        <BankingProvider>
          <TransferProvider>
            <BudgetingProvider>
              <Router>
                <ScrollToTop />
                <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                  <ErrorBoundary>
                    <Navbar />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    <main style={{ flex: '1' }}>
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<LoginWithPreloader />} />
                        <Route path="/register" element={<RegisterWithPreloader />} />
                        <Route path="/password-reset" element={<PasswordResetWithPreloader />} />
                        
                        {/* Protected Routes */}
                        <Route path="/" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <HomePageWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/accounts" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <AccountPageWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/transactions" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <TransactionHistoryWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/account-settings" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <AccountSettingsWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/fund-transfer" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <FundTransferWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/bill-payment" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <BillPaymentWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/transaction-confirmation" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <TransactionConfirmationWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/expense-tracker" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <ExpenseTrackerWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/financial-goals" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <FinancialGoalsWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/budget-analytics" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <BudgetAnalyticsWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/financial-summary" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <FinancialSummaryPageWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/security" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <SecurityPageWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/budgeting" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <BudgetingPageWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <UserProfileWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/admin-dashboard" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <AdminDashboardWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/moderator-dashboard" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <ModeratorDashboardWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/add-account-form" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <AddAccountForm />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/account-detail/:accountId" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <AccountDetailsPage />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/faq" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <NavyFederalFAQ />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/help-center" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <HelpCenter />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/atm-locator" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <ATMLocator />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/branch-locator" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <BranchLocator />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/mobile-app" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <MobileBanking />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/calculators" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <LoanCalculator />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/financial-education" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <FinancialEducation />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/about-us" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <AboutUs />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/careers" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <CareerPage />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/newsroom" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <NewsroomPage />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="community" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <CommunitySupport />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/security" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <SecurityCenter />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/contact" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <ContactInformationPage />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/transaction-receipt/:transactionId" element={
                          <ProtectedRoute>
                            <ErrorBoundary>
                              <TransactionReceiptWithPreloader />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />

                        {/* Catch all - redirect to login */}
                        <Route path="*" element={<Navigate to="/login" replace />} />
                      </Routes>
                    </main>
                  </ErrorBoundary>
                  {/* Add Footer Here */}
                  <ErrorBoundary>
                    <Footer />
                  </ErrorBoundary>
                </div>
              </Router>
            </BudgetingProvider>
          </TransferProvider>
        </BankingProvider>
      </NavyFederalProvider>
    </ErrorBoundary>
  );
}

export default App;