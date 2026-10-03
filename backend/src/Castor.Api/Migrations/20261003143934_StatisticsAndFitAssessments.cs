using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Castor.Api.Migrations
{
    /// <inheritdoc />
    public partial class StatisticsAndFitAssessments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FitAssessments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InnovationId = table.Column<Guid>(type: "uuid", nullable: false),
                    MunicipalityId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataYear = table.Column<int>(type: "integer", nullable: false),
                    Fit = table.Column<string>(type: "text", nullable: false),
                    Summary = table.Column<string>(type: "text", nullable: false),
                    Unchanged = table.Column<List<string>>(type: "text[]", nullable: false),
                    ToAdapt = table.Column<List<string>>(type: "text[]", nullable: false),
                    Missing = table.Column<List<string>>(type: "text[]", nullable: false),
                    ServiceProvider = table.Column<string>(type: "text", nullable: true),
                    ServiceForm = table.Column<string>(type: "text", nullable: true),
                    ScaleEstimate = table.Column<string>(type: "text", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    Comparison = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FitAssessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FitAssessments_Innovations_InnovationId",
                        column: x => x.InnovationId,
                        principalTable: "Innovations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FitAssessments_Municipalities_MunicipalityId",
                        column: x => x.MunicipalityId,
                        principalTable: "Municipalities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FitAssessments_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Indicators",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ObserverId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Group = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Source = table.Column<string>(type: "text", nullable: true),
                    Unit = table.Column<string>(type: "text", nullable: true),
                    ChallengeAreaCodes = table.Column<List<string>>(type: "text[]", nullable: false),
                    General = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Indicators", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FitAssistantMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FitAssessmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    Text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FitAssistantMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FitAssistantMessages_FitAssessments_FitAssessmentId",
                        column: x => x.FitAssessmentId,
                        principalTable: "FitAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FitAssistantMessages_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "IndicatorValues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IndicatorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Level = table.Column<string>(type: "text", nullable: false),
                    TerritoryCode = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Value = table.Column<decimal>(type: "numeric(19,6)", precision: 19, scale: 6, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IndicatorValues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IndicatorValues_Indicators_IndicatorId",
                        column: x => x.IndicatorId,
                        principalTable: "Indicators",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FitAssessments_CreatedByUserId",
                table: "FitAssessments",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FitAssessments_MunicipalityId",
                table: "FitAssessments",
                column: "MunicipalityId");

            migrationBuilder.CreateIndex(
                name: "IX_FitAssessments_OnePerInnovationMunicipalityAndYear",
                table: "FitAssessments",
                columns: new[] { "InnovationId", "MunicipalityId", "DataYear" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FitAssistantMessages_FitAssessmentId_UserId_CreatedAt",
                table: "FitAssistantMessages",
                columns: new[] { "FitAssessmentId", "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_FitAssistantMessages_UserId",
                table: "FitAssistantMessages",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Indicators_UniqueObserverId",
                table: "Indicators",
                column: "ObserverId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_IndicatorValues_Level_TerritoryCode",
                table: "IndicatorValues",
                columns: new[] { "Level", "TerritoryCode" });

            migrationBuilder.CreateIndex(
                name: "IX_IndicatorValues_OnePerTerritoryAndYear",
                table: "IndicatorValues",
                columns: new[] { "IndicatorId", "Level", "TerritoryCode", "Year" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FitAssistantMessages");

            migrationBuilder.DropTable(
                name: "IndicatorValues");

            migrationBuilder.DropTable(
                name: "FitAssessments");

            migrationBuilder.DropTable(
                name: "Indicators");
        }
    }
}
