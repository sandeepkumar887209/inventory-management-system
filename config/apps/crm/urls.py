from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    LeadViewSet, ActivityViewSet, FollowUpViewSet, TagViewSet,
    CRMDashboardView, UsersForAssignmentView, CurrentUserView,
    AccountViewSet, ContactViewSet, DealViewSet, QuoteViewSet
)

router = DefaultRouter()
router.register(r"leads",      LeadViewSet,     basename="leads")
router.register(r"activities", ActivityViewSet, basename="activities")
router.register(r"followups",  FollowUpViewSet, basename="followups")
router.register(r"tags",       TagViewSet,      basename="tags")
router.register(r"accounts",   AccountViewSet,  basename="accounts")
router.register(r"contacts",   ContactViewSet,  basename="contacts")
router.register(r"deals",      DealViewSet,     basename="deals")
router.register(r"quotes",     QuoteViewSet,    basename="quotes")

urlpatterns = router.urls + [
    path("dashboard/", CRMDashboardView.as_view(), name="crm-dashboard"),
    path("users/",     UsersForAssignmentView.as_view(), name="crm-users"),
    path("me/",        CurrentUserView.as_view(), name="crm-me"),
]