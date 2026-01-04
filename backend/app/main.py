from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import (
    auth_router,
    admin_router,
    stores_router,
    products_router,
    combos_router,
    orders_router,
    sessions_router,
    customers_router,
    units_router,
)

app = FastAPI(
    title="QuickStore API",
    description="Backend API for QuickStore POS System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(stores_router)
app.include_router(products_router)
app.include_router(combos_router)
app.include_router(orders_router)
app.include_router(sessions_router)
app.include_router(customers_router)
app.include_router(units_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "QuickStore API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
