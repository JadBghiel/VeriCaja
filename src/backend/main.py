from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables
from routers import dashboard, inventory, compliance, pos

app = FastAPI(title="VeriCaja API", description="Audit-Proof Financial Engine for Spanish Autónomos")

# create db tables on startup
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include routers
app.include_router(dashboard.router)
app.include_router(inventory.router)
app.include_router(compliance.router)
app.include_router(pos.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to the VeriCaja API",
        "version": "1.0.0",
        "description": "Audit-Proof Financial Engine for Spanish Autónomos"
    }
