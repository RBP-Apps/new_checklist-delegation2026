import React, { useState, useEffect } from 'react'
import AdminLayout from '../components/layout/AdminLayout'
import { Calendar, Clock, CalendarDays, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

// Google Apps Script URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx5U4JPKvN86ZRm02dLZ7mD1C4F4jdGNICL4g-RV4doExSw8QC_IVm_huURo09q2HDvBQ/exec"

function WorkingDate() {
    const [activeTab, setActiveTab] = useState('workingDate')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [username, setUsername] = useState('')
    const [userRole, setUserRole] = useState('')
    const [historyData, setHistoryData] = useState([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

    // Live clock state
    const [currentDateTime, setCurrentDateTime] = useState(new Date())

    // Time slots array
    const timeSlots = [
        '09:30 AM', '10:30 AM', '11:30 AM', '12:30 PM',
        '01:30 PM', '02:30 PM', '03:30 PM', '04:30 PM',
        '05:30 PM', '06:30 PM', '07:30 PM', '08:30 PM', '09:30 PM'
    ]

    // State for working details
    const [workingDetails, setWorkingDetails] = useState(
        timeSlots.reduce((acc, time) => ({ ...acc, [time]: '' }), {})
    )

    // User-selected date and time for submission
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        return now.toISOString().split('T')[0]; // YYYY-MM-DD format for input
    })
    const [selectedTime, setSelectedTime] = useState(() => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    })

    // Get username and role from session
    useEffect(() => {
        const storedUsername = sessionStorage.getItem('username')
        const storedRole = sessionStorage.getItem('role')
        setUsername(storedUsername || 'Unknown')
        setUserRole(storedRole?.toLowerCase().trim() || 'user')
    }, [])

    // Load saved working details from localStorage when username is available
    useEffect(() => {
        if (username && username !== 'Unknown') {
            const storageKey = `workingDetails_${username}`;
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    // Merge with existing timeSlots structure to ensure all slots exist
                    const merged = timeSlots.reduce((acc, time) => ({
                        ...acc,
                        [time]: parsed[time] || ''
                    }), {});
                    setWorkingDetails(merged);
                    console.log('Restored working details for', username);
                } catch (e) {
                    console.error('Error parsing saved working details:', e);
                }
            }
        }
    }, [username]);

    // Save working details to localStorage whenever they change
    useEffect(() => {
        if (username && username !== 'Unknown') {
            const storageKey = `workingDetails_${username}`;
            // Only save if there's at least one non-empty value
            const hasContent = Object.values(workingDetails).some(v => v && v.trim() !== '');
            if (hasContent) {
                localStorage.setItem(storageKey, JSON.stringify(workingDetails));
            } else {
                // Clear storage if all fields are empty
                localStorage.removeItem(storageKey);
            }
        }
    }, [workingDetails, username]);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // Format date for display
    const formatDisplayDate = (date) => {
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    // Format time for display (12-hour format with seconds)
    const formatDisplayTime = (date) => {
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        })
    }

    // Format date as DD/MM/YYYY
    const formatDateDDMMYYYY = (date) => {
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
    }

    // Format date string from ISO/various formats to DD/MM/YYYY
    const formatHistoryDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            // Already in DD/MM/YYYY format
            if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
                return dateStr;
            }
            // Parse ISO or other date formats
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch {
            return dateStr;
        }
    }

    // Format time string to HH:MM AM/PM
    const formatHistoryTime = (timeStr) => {
        if (!timeStr) return '-';
        try {
            // If it's already in "09:30 AM" format, return as-is
            if (typeof timeStr === 'string' && /^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(timeStr)) {
                return timeStr;
            }
            // If it's an ISO string like "1899-12-30T05:08:50.000Z"
            if (typeof timeStr === 'string' && timeStr.includes('T')) {
                const date = new Date(timeStr);
                if (isNaN(date.getTime())) return timeStr;
                let hours = date.getUTCHours();
                const minutes = date.getUTCMinutes().toString().padStart(2, '0');
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12;
                return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
            }
            return timeStr;
        } catch {
            return timeStr;
        }
    }

    // Format timestamp to DD/MM/YYYY HH:MM
    const formatHistoryTimestamp = (tsStr) => {
        if (!tsStr) return '-';
        try {
            const date = new Date(tsStr);
            if (isNaN(date.getTime())) return tsStr;
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            return `${day}/${month}/${year} ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
        } catch {
            return tsStr;
        }
    }

    // Improved function to get the current maximum ID from the sheet
    const getLastUniqueNumber = async () => {
        try {
            console.log('Fetching latest IDs from WorkingDate sheet...');
            const response = await fetch(`${APPS_SCRIPT_URL}?action=fetch&sheetName=WorkingDate`);
            const data = await response.json();

            console.log('Sheet data received:', data);

            let maxId = 0;

            // Check for the new format from fetchWorkingDateData
            if (data?.success && data?.data) {
                console.log('Processing success/data format');

                data.data.forEach(row => {
                    const cellValue = row.uniqueNumber;
                    console.log('Row unique number:', cellValue);

                    if (cellValue && typeof cellValue === 'string' && cellValue.startsWith('W')) {
                        // Extract just the numeric part after 'W'
                        const numStr = cellValue.substring(1);
                        const num = parseInt(numStr, 10);

                        console.log('Parsed number:', num, 'from:', cellValue);

                        if (!isNaN(num) && num > maxId) {
                            maxId = num;
                        }
                    }
                });
            }
            // Check for table format (fallback)
            else if (data?.table?.rows) {
                console.log('Processing table.rows format');

                data.table.rows.forEach((row, index) => {
                    // Skip header row (index 0)
                    if (index > 0) {
                        const cellValue = row.c?.[2]?.v; // Column C is Unique Number
                        console.log('Row', index, 'unique number:', cellValue);

                        if (cellValue && typeof cellValue === 'string' && cellValue.startsWith('W')) {
                            const numStr = cellValue.substring(1);
                            const num = parseInt(numStr, 10);

                            console.log('Parsed number:', num, 'from:', cellValue);

                            if (!isNaN(num) && num > maxId) {
                                maxId = num;
                            }
                        }
                    }
                });
            }

            console.log('Current Max ID found:', maxId);
            return maxId;
        } catch (error) {
            console.error('Error fetching last unique number:', error);
            return 0;
        }
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const response = await fetch(`${APPS_SCRIPT_URL}?sheetName=WorkingDate&action=fetch`);
            const data = await response.json();

            console.log('History data received:', data);

            if (data?.success && data?.data) {
                console.log('Processing success/data format');

                let filtered;

                // Admin can see all data, regular users only see their own
                if (userRole === 'admin' || userRole === 'superadmin') {
                    console.log('Admin access: showing all history entries');
                    filtered = data.data;
                } else {
                    // Filter by username (case-insensitive)
                    filtered = data.data.filter(row => {
                        const rowName = row.name?.toString().toLowerCase().trim() || '';
                        const userName = username.toLowerCase().trim();
                        return rowName === userName;
                    });
                    console.log('Filtered history for', username, ':', filtered.length, 'entries');
                }

                // Sort by timestamp descending (most recent first)
                filtered.sort((a, b) => {
                    const dateA = new Date(a.timestamp);
                    const dateB = new Date(b.timestamp);
                    return dateB - dateA; // Most recent first
                });

                setHistoryData(filtered);

                if (filtered.length === 0) {
                    console.log('No history found for user:', username);
                }
            } else {
                console.error('Unexpected data format:', data);
                setErrorMessage('Unexpected data format received from server.');
                setTimeout(() => setErrorMessage(''), 5000);
            }

        } catch (error) {
            console.error('Error fetching history:', error);
            setErrorMessage(`Failed to load history data: ${error.message}`);
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Fetch history when tab changes to history
    useEffect(() => {
        if (activeTab === 'history' && username && userRole) {
            fetchHistory();
        }
    }, [activeTab, username, userRole]);

    const formatUniqueNumber = (num) => {
        return `W${num.toString().padStart(3, '0')}`;
    };

    // Handle input change
    const handleInputChange = (time, value) => {
        setWorkingDetails(prev => ({ ...prev, [time]: value }))
    }

    // Handle submit - Batch refined to only send filled slots
    const handleSubmit = async () => {
        // Step 1: Filter to get ONLY the slots with data
        const filledSlots = Object.entries(workingDetails)
            .filter(([_, value]) => value && value.trim() !== '')

        if (filledSlots.length === 0) {
            setErrorMessage('Please enter at least one working detail before submitting.')
            setTimeout(() => setErrorMessage(''), 3000)
            return
        }

        setIsSubmitting(true)
        setErrorMessage('')
        setSuccessMessage('')

        try {
            // Use user-selected date instead of current date
            const [year, month, day] = selectedDate.split('-');
            const formattedDate = `${day}/${month}/${year}`; // DD/MM/YYYY
            const timestamp = new Date().toLocaleString('en-IN')

            // Get the last ID once before the loop
            let currentId = await getLastUniqueNumber()

            console.log('Starting ID for this submission:', currentId);

            // Step 2: Prepare all rows in a single batch
            const rowsToSubmit = []
            for (const [timeSlot, details] of filledSlots) {
                currentId++;
                const uniqueNumber = formatUniqueNumber(currentId)
                rowsToSubmit.push([
                    timestamp,          // A: Timestamp
                    formattedDate,      // B: Date (DD/MM/YYYY) - User selected
                    uniqueNumber,       // C: Unique Number
                    username,           // D: Name
                    timeSlot,           // E: Time
                    details             // F: Working Details
                ])

                console.log('Prepared row with unique number:', uniqueNumber);
            }

            console.log('Batch submitting filled slots:', rowsToSubmit)

            // Step 3: Single submission call
            const submitUrl = `${APPS_SCRIPT_URL}?sheetName=WorkingDate&action=insert&batchInsert=true`

            const response = await fetch(submitUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    sheetName: 'WorkingDate',
                    action: 'insert',
                    batchInsert: 'true',
                    rowData: JSON.stringify(rowsToSubmit)
                })
            })

            // Success feedback - clear form and localStorage
            setWorkingDetails(timeSlots.reduce((acc, time) => ({ ...acc, [time]: '' }), {}))

            // Clear localStorage for this user after successful submission
            if (username && username !== 'Unknown') {
                localStorage.removeItem(`workingDetails_${username}`);
                console.log('Cleared saved working details after submission');
            }

            setSuccessMessage(`Successfully submitted ${rowsToSubmit.length} working detail(s)!`)

            // Immediately refresh history to show new entries
            if (activeTab === 'history') {
                fetchHistory();
            }

            setTimeout(() => setSuccessMessage(''), 5000)

        } catch (error) {
            console.error('Batch submission error:', error)
            setErrorMessage(`Failed to submit: ${error.message}`)
            setTimeout(() => setErrorMessage(''), 5000)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Count filled slots
    const filledSlotsCount = Object.values(workingDetails).filter(v => v && v.trim() !== '').length

    // Clear all inputs
    const handleClearAll = () => {
        setWorkingDetails(timeSlots.reduce((acc, time) => ({ ...acc, [time]: '' }), {}))
        setSuccessMessage('All fields cleared.')
        setTimeout(() => setSuccessMessage(''), 3000)
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">Working Date Management</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                            User: {username}
                        </span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('workingDate')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'workingDate'
                            ? 'bg-white text-blue-600 shadow-md'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                    >
                        <Calendar className="h-4 w-4" />
                        Working Date
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'history'
                            ? 'bg-white text-blue-600 shadow-md'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                    >
                        <Clock className="h-4 w-4" />
                        History
                    </button>
                </div>

                {/* Floating Toast Notifications */}
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 space-y-3 pointer-events-none">
                    {successMessage && (
                        <div className="pointer-events-auto bg-white border-l-4 border-green-500 text-green-800 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="bg-green-100 p-2 rounded-full">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">Success</span>
                                <span className="text-xs opacity-90">{successMessage}</span>
                            </div>
                        </div>
                    )}
                    {errorMessage && (
                        <div className="pointer-events-auto bg-white border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="bg-red-100 p-2 rounded-full">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">Error</span>
                                <span className="text-xs opacity-90">{errorMessage}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    {activeTab === 'workingDate' && (
                        <div>
                            {/* Header Section */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex flex-col lg:flex-row gap-6 items-start">
                                    {/* Current Date & Time Display Card */}
                                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-lg w-full lg:w-auto lg:min-w-[280px]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <CalendarDays className="h-4 w-4 opacity-80" />
                                            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Current Date & Time</span>
                                            <span className="ml-auto flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                                <span className="text-xs font-bold opacity-70">Live</span>
                                            </span>
                                        </div>
                                        <p className="text-lg font-bold opacity-95 mb-1">{formatDisplayDate(currentDateTime)}</p>
                                        <p className="text-3xl font-extrabold tracking-wide font-mono">{formatDisplayTime(currentDateTime)}</p>
                                    </div>

                                    {/* Date Details Card - Editable */}
                                    <div className="flex-1 w-full lg:w-auto">
                                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 h-full">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date Details</h3>
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">Editable</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 mb-2 block">Date</label>
                                                    <input
                                                        type="date"
                                                        value={selectedDate}
                                                        onChange={(e) => setSelectedDate(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-base font-bold text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 mb-2 block">Time</label>
                                                    <input
                                                        type="time"
                                                        value={selectedTime}
                                                        onChange={(e) => setSelectedTime(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-base font-bold text-gray-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-3 italic">Select the date and time for your working details submission</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Time Slots Table */}
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Daily Schedule</h3>
                                    <div className="flex items-center gap-3">
                                        {filledSlotsCount > 0 && (
                                            <span className="text-xs text-blue-600 font-bold">
                                                {filledSlotsCount} slot(s) filled
                                            </span>
                                        )}
                                        <button
                                            onClick={handleClearAll}
                                            disabled={filledSlotsCount === 0}
                                            className={`text-xs px-3 py-1 rounded font-bold transition-all duration-200 ${filledSlotsCount === 0
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                                }`}
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-[140px_1fr] bg-gradient-to-r from-gray-50 to-gray-100">
                                        <div className="px-5 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                                            Time Slot
                                        </div>
                                        <div className="px-5 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Working Details
                                        </div>
                                    </div>

                                    {/* Table Body */}
                                    <div className="divide-y divide-gray-100 mb-10">
                                        {timeSlots.map((time, index) => (
                                            <div
                                                key={index}
                                                className={`grid grid-cols-[140px_1fr] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                                    } hover:bg-blue-50/50`}
                                            >
                                                <div className="px-5 py-4 flex items-center gap-3 border-r border-gray-100">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${workingDetails[time].trim() ? 'bg-green-100' : 'bg-blue-100'}`}>
                                                        <Clock className={`h-4 w-4 ${workingDetails[time].trim() ? 'text-green-600' : 'text-blue-600'}`} />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700">{time}</span>
                                                </div>
                                                <div className="px-5 py-3 flex items-center">
                                                    <input
                                                        type="text"
                                                        value={workingDetails[time]}
                                                        onChange={(e) => handleInputChange(time, e.target.value)}
                                                        placeholder="Add notes for this slot..."
                                                        className="w-full px-5 py-2.5 bg-slate-50/50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400/70 transition-all duration-300 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-400 hover:bg-slate-50 shadow-sm focus:shadow-md"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Floating Submit Button */}
                                <div className="fixed bottom-10 right-8 z-50">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || filledSlotsCount === 0}
                                        className={`group flex items-center gap-3 px-8 py-4 rounded-full text-base font-bold transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 ${isSubmitting || filledSlotsCount === 0
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                            : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white hover:shadow-blue-500/40 ring-4 ring-white shadow-xl'
                                            }`}
                                    >
                                        <div className="relative">
                                            {isSubmitting ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            )}
                                            {filledSlotsCount > 0 && !isSubmitting && (
                                                <span className="absolute -top-6 -right-4 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white animate-bounce shadow-lg">
                                                    {filledSlotsCount}
                                                </span>
                                            )}
                                        </div>
                                        <span>
                                            {isSubmitting ? 'Submitting...' : 'Submit Working Details'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Submission History</h2>
                                    <p className="text-sm text-gray-500 mt-1">View your previous working date submissions</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                        {historyData.length} entries
                                    </span>
                                    <button
                                        onClick={fetchHistory}
                                        disabled={isLoadingHistory}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoadingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                                        {isLoadingHistory ? 'Refreshing...' : 'Refresh History'}
                                    </button>
                                </div>
                            </div>

                            {isLoadingHistory ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <Loader2 className="h-12 w-12 animate-spin mb-4 text-blue-500" />
                                    <p className="font-bold text-gray-600">Loading your history...</p>
                                    <p className="text-sm text-gray-400 mt-1">Fetching data from WorkingDate sheet</p>
                                </div>
                            ) : historyData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-blue-200">
                                    <div className="relative mb-4">
                                        <Clock className="h-16 w-16 text-blue-300" />
                                        <div className="absolute -top-2 -right-2 bg-blue-100 p-2 rounded-full">
                                            <AlertCircle className="h-6 w-6 text-blue-500" />
                                        </div>
                                    </div>
                                    <p className="text-gray-700 font-bold text-lg mb-2">No history found</p>
                                    <p className="text-gray-500 text-center max-w-md mb-6">
                                        No submissions found for <span className="font-bold text-blue-600">{username}</span>.
                                        Start by submitting your first working details.
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('workingDate')}
                                        className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                                    >
                                        <Send className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        Go to Working Date
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ID</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Time</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Working Details</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Submitted</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {historyData.map((item, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-gray-900">{formatHistoryDate(item.date)}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                                                {item.uniqueNumber}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                                                <span className="text-sm font-bold text-indigo-600">{formatHistoryTime(item.time)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-800 max-w-xs truncate" title={item.details}>
                                                                {item.details}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-xs text-gray-500">{formatHistoryTimestamp(item.timestamp)}</div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                                        Showing {historyData.length} entries for {username}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}

export default WorkingDate