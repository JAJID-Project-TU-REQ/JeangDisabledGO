package main

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// UserRole describes the type of user in the system.
type UserRole string

const (
	RoleVolunteer UserRole = "volunteer"
	RoleRequester UserRole = "requester"
)

// UserProfile represents a volunteer or requester account.
type UserProfile struct {
	ID           string    `json:"id"`
	Role         UserRole  `json:"role"`
	FullName     string    `json:"fullName"`
	Phone        string    `json:"phone"`
	Email        string    `json:"email"`
	Address      string    `json:"address"`
	Skills       []string  `json:"skills"`
	Interests    []string  `json:"interests"`
	Biography    string    `json:"biography"`
	Rating       float64   `json:"rating"`
	CompletedJob int       `json:"completedJobs"`
	CreatedAt    time.Time `json:"createdAt"`
}

// JobSummary contains a high level overview of an assignment.
type JobSummary struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	RequesterID string   `json:"requesterId"`
	ScheduledOn string   `json:"scheduledOn"`
	Location    string   `json:"location"`
	DistanceKm  float64  `json:"distanceKm"`
	Tags        []string `json:"tags"`
	Status      string   `json:"status"`
}

// JobDetail expands on the summary with more context used throughout the UI.
type JobDetail struct {
	JobSummary
	Description   string   `json:"description"`
	MeetingPoint  string   `json:"meetingPoint"`
	Requirements  []string `json:"requirements"`
	Latitude      float64  `json:"latitude"`
	Longitude     float64  `json:"longitude"`
	ContactName   string   `json:"contactName"`
	ContactNumber string   `json:"contactNumber"`
}

// Application represents a volunteer application to a job.
type Application struct {
	ID        string    `json:"id"`
	JobID     string    `json:"jobId"`
	Volunteer string    `json:"volunteerId"`
	Message   string    `json:"message"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// LoginResponse is returned to callers after successful authentication.
type LoginResponse struct {
	Token string       `json:"token"`
	User  *UserProfile `json:"user"`
}

// RegisterRequest captures the data for a new user registration.
type RegisterRequest struct {
	Role      UserRole `json:"role"` // volunteer or requester
	FullName  string   `json:"fullName"`
	Phone     string   `json:"phone"`
	Email     string   `json:"email"`
	Address   string   `json:"address"`
	Password  string   `json:"password"`
	Skills    []string `json:"skills"`
	Interests []string `json:"interests"`
	Biography string   `json:"biography"`
}

// LoginRequest contains username/password pairs. For the sample project any password works.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// ApplyRequest includes an optional message when volunteers express interest.
type ApplyRequest struct {
	VolunteerID string `json:"volunteerId"`
	Message     string `json:"message"`
}

// FeedbackRequest is stored when the requester completes a job.
type FeedbackRequest struct {
	VolunteerID string  `json:"volunteerId"`
	Rating      float64 `json:"rating"`
	Comment     string  `json:"comment"`
}

// CreateJobRequest allows requesters to publish new opportunities.
type CreateJobRequest struct {
	RequesterID  string   `json:"requesterId"`
	Title        string   `json:"title"`
	ScheduledOn  string   `json:"scheduledOn"`
	Location     string   `json:"location"`
	MeetingPoint string   `json:"meetingPoint"`
	Description  string   `json:"description"`
	Requirements []string `json:"requirements"`
	Latitude     float64  `json:"latitude"`
	Longitude    float64  `json:"longitude"`
}

type memoryStore struct {
	users        map[string]*UserProfile
	jobs         map[string]*JobDetail
	applications map[string]*Application
	mu           sync.RWMutex
}

var store = newMemoryStore()

func newMemoryStore() *memoryStore {
	s := &memoryStore{
		users:        make(map[string]*UserProfile),
		jobs:         make(map[string]*JobDetail),
		applications: make(map[string]*Application),
	}

	// Seed a couple of accounts.
	s.users["volunteer-1"] = &UserProfile{
		ID:           "volunteer-1",
		Role:         RoleVolunteer,
		FullName:     "Anya Volunteer",
		Phone:        "081-111-1111",
		Email:        "anya.volunteer@example.com",
		Address:      "Bangkok, Thailand",
		Skills:       []string{"Wheelchair assistance", "Thai/English"},
		Interests:    []string{"Hospital visits", "Transportation"},
		Biography:    "Former physical therapist now volunteering weekends.",
		Rating:       4.9,
		CompletedJob: 42,
		CreatedAt:    time.Now().AddDate(0, -3, 0),
	}
	s.users["requester-1"] = &UserProfile{
		ID:           "requester-1",
		Role:         RoleRequester,
		FullName:     "Mali Nimman",
		Phone:        "082-222-2222",
		Email:        "mali.nimman@example.com",
		Address:      "Chiang Mai, Thailand",
		Biography:    "Coordinating support for my father while he recovers.",
		Rating:       4.7,
		CompletedJob: 13,
		CreatedAt:    time.Now().AddDate(0, -1, -10),
	}

	// Seed jobs referenced in the wireframes.
	job1 := &JobDetail{
		JobSummary: JobSummary{
			ID:          "job-1001",
			Title:       "Wheelchair assistance at hospital",
			RequesterID: "requester-1",
			ScheduledOn: "2025-02-11",
			Location:    "Siriraj Hospital, Bangkok",
			DistanceKm:  3.2,
			Tags:        []string{"Hospital", "Wheelchair"},
			Status:      "open",
		},
		Description:   "Meet at the lobby and assist with navigating to the cardiology department.",
		MeetingPoint:  "Entrance B, Siriraj Hospital",
		Requirements:  []string{"Comfortable pushing a wheelchair", "Able to communicate with nurses"},
		Latitude:      13.7563,
		Longitude:     100.5018,
		ContactName:   "Mali Nimman",
		ContactNumber: "082-222-2222",
	}

	job2 := &JobDetail{
		JobSummary: JobSummary{
			ID:          "job-1002",
			Title:       "Home wheelchair ramp inspection",
			RequesterID: "requester-1",
			ScheduledOn: "2025-02-13",
			Location:    "Ratchathewi, Bangkok",
			DistanceKm:  6.0,
			Tags:        []string{"Home visit", "Accessibility"},
			Status:      "open",
		},
		Description:   "Check the ramp installed last month and provide recommendations.",
		MeetingPoint:  "House 72/4, Ratchathewi",
		Requirements:  []string{"Experience with accessibility equipment"},
		Latitude:      13.7650,
		Longitude:     100.5370,
		ContactName:   "Mali Nimman",
		ContactNumber: "082-222-2222",
	}

	s.jobs[job1.ID] = job1
	s.jobs[job2.ID] = job2

	return s
}

func main() {
	router := gin.Default()
	router.Use(corsMiddleware())

	api := router.Group("/api")
	{
		auth := api.Group("/auth")
		auth.POST("/login", loginHandler)
		auth.POST("/register", registerHandler)
	}

	api.GET("/profiles/:id", getProfileHandler)
	api.GET("/jobs", listJobsHandler)
	api.GET("/jobs/:id", getJobHandler)
	api.POST("/jobs", createJobHandler)
	api.POST("/jobs/:id/apply", applyJobHandler)
	api.POST("/jobs/:id/feedback", completeJobHandler)
	api.GET("/volunteers/:id/applications", listVolunteerApplicationsHandler)
	api.GET("/requesters/:id/jobs", listRequesterJobsHandler)

	router.Run(":8080")
}

func loginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	store.mu.RLock()
	defer store.mu.RUnlock()
	for _, profile := range store.users {
		if strings.EqualFold(profile.Email, req.Email) {
			c.JSON(http.StatusOK, LoginResponse{
				Token: "mock-token-" + profile.ID,
				User:  profile,
			})
			return
		}
	}

	c.JSON(http.StatusUnauthorized, gin.H{"error": "account not found"})
}

func registerHandler(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	if req.Role != RoleVolunteer && req.Role != RoleRequester {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role must be volunteer or requester"})
		return
	}

	if strings.TrimSpace(req.FullName) == "" || strings.TrimSpace(req.Email) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "full name and email are required"})
		return
	}

	newID := strings.ToLower(string(req.Role)) + "-" + strings.ReplaceAll(strings.Split(req.FullName, " ")[0], " ", "") + time.Now().Format("150405")
	profile := &UserProfile{
		ID:           newID,
		Role:         req.Role,
		FullName:     req.FullName,
		Phone:        req.Phone,
		Email:        req.Email,
		Address:      req.Address,
		Skills:       req.Skills,
		Interests:    req.Interests,
		Biography:    req.Biography,
		Rating:       0,
		CompletedJob: 0,
		CreatedAt:    time.Now(),
	}

	store.mu.Lock()
	defer store.mu.Unlock()

	store.users[profile.ID] = profile

	c.JSON(http.StatusCreated, profile)
}

func getProfileHandler(c *gin.Context) {
	id := c.Param("id")

	store.mu.RLock()
	defer store.mu.RUnlock()
	profile, ok := store.users[id]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "profile not found"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

func listJobsHandler(c *gin.Context) {
	store.mu.RLock()
	defer store.mu.RUnlock()

	items := make([]JobSummary, 0, len(store.jobs))
	for _, job := range store.jobs {
		items = append(items, job.JobSummary)
	}

	c.JSON(http.StatusOK, gin.H{"jobs": items})
}

func getJobHandler(c *gin.Context) {
	id := c.Param("id")

	store.mu.RLock()
	defer store.mu.RUnlock()
	job, ok := store.jobs[id]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	c.JSON(http.StatusOK, job)
}

func createJobHandler(c *gin.Context) {
	var req CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	if req.RequesterID == "" || strings.TrimSpace(req.Title) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "requesterId and title are required"})
		return
	}

	store.mu.Lock()
	defer store.mu.Unlock()

	if _, ok := store.users[req.RequesterID]; !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "requester profile missing"})
		return
	}

	id := fmt.Sprintf("job-%d", len(store.jobs)+1001)
	job := &JobDetail{
		JobSummary: JobSummary{
			ID:          id,
			Title:       req.Title,
			RequesterID: req.RequesterID,
			ScheduledOn: req.ScheduledOn,
			Location:    req.Location,
			DistanceKm:  0,
			Tags:        req.Requirements,
			Status:      "open",
		},
		Description:   req.Description,
		MeetingPoint:  req.MeetingPoint,
		Requirements:  req.Requirements,
		Latitude:      req.Latitude,
		Longitude:     req.Longitude,
		ContactName:   store.users[req.RequesterID].FullName,
		ContactNumber: store.users[req.RequesterID].Phone,
	}

	store.jobs[id] = job

	c.JSON(http.StatusCreated, job)
}

func applyJobHandler(c *gin.Context) {
	jobID := c.Param("id")
	var req ApplyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	store.mu.Lock()
	defer store.mu.Unlock()

	job, ok := store.jobs[jobID]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	if _, exists := store.users[req.VolunteerID]; !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "volunteer profile missing"})
		return
	}

	appID := jobID + "-" + req.VolunteerID
	now := time.Now()
	application := &Application{
		ID:        appID,
		JobID:     jobID,
		Volunteer: req.VolunteerID,
		Message:   req.Message,
		Status:    "pending",
		CreatedAt: now,
		UpdatedAt: now,
	}
	store.applications[appID] = application

	job.Status = "in_review"
	c.JSON(http.StatusCreated, application)
}

func completeJobHandler(c *gin.Context) {
	jobID := c.Param("id")
	var req FeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	store.mu.Lock()
	defer store.mu.Unlock()

	job, ok := store.jobs[jobID]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	profile, ok := store.users[req.VolunteerID]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "volunteer profile missing"})
		return
	}

	job.Status = "completed"
	profile.CompletedJob++
	if req.Rating > 0 {
		profile.Rating = (profile.Rating*float64(profile.CompletedJob-1) + req.Rating) / float64(profile.CompletedJob)
	}

	c.JSON(http.StatusOK, gin.H{
		"job":     job,
		"profile": profile,
		"feedback": gin.H{
			"rating":  req.Rating,
			"comment": req.Comment,
		},
	})
}

func listVolunteerApplicationsHandler(c *gin.Context) {
	volunteerID := c.Param("id")

	store.mu.RLock()
	defer store.mu.RUnlock()

	if _, ok := store.users[volunteerID]; !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "volunteer not found"})
		return
	}

	type applicationView struct {
		Application *Application `json:"application"`
		Job         JobSummary   `json:"job"`
	}

	items := make([]applicationView, 0)
	for _, application := range store.applications {
		if application.Volunteer == volunteerID {
			if job, ok := store.jobs[application.JobID]; ok {
				items = append(items, applicationView{Application: application, Job: job.JobSummary})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"items": items})
}

func listRequesterJobsHandler(c *gin.Context) {
	requesterID := c.Param("id")

	store.mu.RLock()
	defer store.mu.RUnlock()

	if _, ok := store.users[requesterID]; !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "requester not found"})
		return
	}

	items := make([]JobSummary, 0)
	for _, job := range store.jobs {
		if job.RequesterID == requesterID {
			items = append(items, job.JobSummary)
		}
	}

	c.JSON(http.StatusOK, gin.H{"jobs": items})
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
