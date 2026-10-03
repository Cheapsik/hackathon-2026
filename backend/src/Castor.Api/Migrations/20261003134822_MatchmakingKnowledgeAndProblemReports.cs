using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using NpgsqlTypes;

#nullable disable

namespace Castor.Api.Migrations
{
    /// <inheritdoc />
    public partial class MatchmakingKnowledgeAndProblemReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // unaccent() is only STABLE, and a generated column needs an IMMUTABLE function: this wrapper names the
            // dictionary explicitly, which makes the result depend on the input alone.
            migrationBuilder.Sql(
                """
                CREATE FUNCTION castor_unaccent(text) RETURNS text
                LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
                AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;
                """);

            migrationBuilder.CreateTable(
                name: "BackgroundJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Total = table.Column<int>(type: "integer", nullable: true),
                    Done = table.Column<int>(type: "integer", nullable: false),
                    Failed = table.Column<int>(type: "integer", nullable: false),
                    Error = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    FinishedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BackgroundJobs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChallengeAreas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Number = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Definition = table.Column<string>(type: "text", nullable: false),
                    KeyChallenges = table.Column<List<string>>(type: "text[]", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChallengeAreas", x => x.Id);
                    table.UniqueConstraint("AK_ChallengeAreas_Code", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "Innovations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    ShortDescription = table.Column<string>(type: "text", nullable: true),
                    Categories = table.Column<List<string>>(type: "text[]", nullable: false),
                    Solution = table.Column<string>(type: "text", nullable: true),
                    Problems = table.Column<string>(type: "text", nullable: true),
                    TargetGroup = table.Column<string>(type: "text", nullable: true),
                    Beneficiaries = table.Column<string>(type: "text", nullable: true),
                    Evidence = table.Column<string>(type: "text", nullable: true),
                    Organization = table.Column<string>(type: "text", nullable: true),
                    CardUrl = table.Column<string>(type: "text", nullable: true),
                    VideoUrl = table.Column<string>(type: "text", nullable: true),
                    MaterialsZipUrl = table.Column<string>(type: "text", nullable: true),
                    CardPdfUrl = table.Column<string>(type: "text", nullable: true),
                    TermsUrl = table.Column<string>(type: "text", nullable: true),
                    Featured = table.Column<bool>(type: "boolean", nullable: false),
                    InServiceModel = table.Column<bool>(type: "boolean", nullable: false),
                    Stage = table.Column<string>(type: "text", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: false),
                    SeeksTesters = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    SearchVector = table.Column<NpgsqlTsVector>(type: "tsvector", nullable: true, computedColumnSql: "to_tsvector('simple', castor_unaccent(\n    coalesce(\"Title\", '') || ' ' || coalesce(\"ShortDescription\", '') || ' ' ||\n    coalesce(\"Solution\", '') || ' ' || coalesce(\"Problems\", '') || ' ' ||\n    coalesce(\"TargetGroup\", '') || ' ' || coalesce(\"Beneficiaries\", '')))", stored: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Innovations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Municipalities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Teryt = table.Column<string>(type: "character(7)", fixedLength: true, maxLength: 7, nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Powiat = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Municipalities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Personas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Age = table.Column<int>(type: "integer", nullable: true),
                    Description = table.Column<List<string>>(type: "text[]", nullable: false),
                    Goals = table.Column<List<string>>(type: "text[]", nullable: false),
                    Challenges = table.Column<List<string>>(type: "text[]", nullable: false),
                    Motivations = table.Column<List<string>>(type: "text[]", nullable: false),
                    ChallengeAreaCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Personas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Personas_ChallengeAreas_ChallengeAreaCode",
                        column: x => x.ChallengeAreaCode,
                        principalTable: "ChallengeAreas",
                        principalColumn: "Code",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InnovationGenomes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InnovationId = table.Column<Guid>(type: "uuid", nullable: false),
                    RootCauses = table.Column<List<string>>(type: "text[]", nullable: false),
                    Mechanisms = table.Column<List<string>>(type: "text[]", nullable: false),
                    TargetGroups = table.Column<List<string>>(type: "text[]", nullable: false),
                    Scale = table.Column<string>(type: "text", nullable: true),
                    ChallengeAreaCodes = table.Column<List<string>>(type: "text[]", nullable: false),
                    Summary = table.Column<string>(type: "character varying(600)", maxLength: 600, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ApprovedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ApprovedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    RequiredResources = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InnovationGenomes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InnovationGenomes_Innovations_InnovationId",
                        column: x => x.InnovationId,
                        principalTable: "Innovations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InnovationGenomes_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProblemReports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrackingCode = table.Column<string>(type: "character(8)", fixedLength: true, maxLength: 8, nullable: false),
                    Description = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: false),
                    OriginalDescription = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: true),
                    MunicipalityId = table.Column<Guid>(type: "uuid", nullable: true),
                    Channel = table.Column<string>(type: "text", nullable: false),
                    SubmittedOnBehalf = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    AuthorId = table.Column<Guid>(type: "uuid", nullable: true),
                    ChallengeAreaCodes = table.Column<List<string>>(type: "text[]", nullable: false),
                    RootCauses = table.Column<List<string>>(type: "text[]", nullable: false),
                    TargetGroup = table.Column<string>(type: "text", nullable: true),
                    Keywords = table.Column<List<string>>(type: "text[]", nullable: false),
                    ClassifiedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    QuestionsSettledAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    MatchedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    ClaimedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    ClarifyingQuestions = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProblemReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProblemReports_Municipalities_MunicipalityId",
                        column: x => x.MunicipalityId,
                        principalTable: "Municipalities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProblemReports_Users_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MatchResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProblemReportId = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "text", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: true),
                    InnovationId = table.Column<Guid>(type: "uuid", nullable: true),
                    Justification = table.Column<string>(type: "text", nullable: false),
                    CitedFields = table.Column<List<string>>(type: "text[]", nullable: false),
                    Adaptation = table.Column<string>(type: "text", nullable: true),
                    HybridName = table.Column<string>(type: "text", nullable: true),
                    HybridDescription = table.Column<string>(type: "text", nullable: true),
                    SourceInnovationIds = table.Column<List<Guid>>(type: "uuid[]", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatchResults", x => x.Id);
                    table.CheckConstraint("CK_MatchResults_KindShape", "(\"Kind\" = 'MATCH' AND \"InnovationId\" IS NOT NULL AND \"Score\" IS NOT NULL) OR (\"Kind\" = 'HYBRID' AND \"InnovationId\" IS NULL AND \"HybridName\" IS NOT NULL)");
                    table.CheckConstraint("CK_MatchResults_ScoreRange", "\"Score\" IS NULL OR \"Score\" BETWEEN 0 AND 100");
                    table.ForeignKey(
                        name: "FK_MatchResults_Innovations_InnovationId",
                        column: x => x.InnovationId,
                        principalTable: "Innovations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MatchResults_ProblemReports_ProblemReportId",
                        column: x => x.ProblemReportId,
                        principalTable: "ProblemReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BackgroundJobs_Status",
                table: "BackgroundJobs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_InnovationGenomes_ApprovedByUserId",
                table: "InnovationGenomes",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InnovationGenomes_OnePerInnovation",
                table: "InnovationGenomes",
                column: "InnovationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Innovations_Search",
                table: "Innovations",
                column: "SearchVector")
                .Annotation("Npgsql:IndexMethod", "GIN");

            migrationBuilder.CreateIndex(
                name: "IX_Innovations_UniqueSourceKey",
                table: "Innovations",
                column: "SourceKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_InnovationId",
                table: "MatchResults",
                column: "InnovationId");

            migrationBuilder.CreateIndex(
                name: "IX_MatchResults_OnePerPosition",
                table: "MatchResults",
                columns: new[] { "ProblemReportId", "Position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Municipalities_UniqueTeryt",
                table: "Municipalities",
                column: "Teryt",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Personas_ChallengeAreaCode",
                table: "Personas",
                column: "ChallengeAreaCode");

            migrationBuilder.CreateIndex(
                name: "IX_Personas_UniqueName",
                table: "Personas",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProblemReports_AuthorId",
                table: "ProblemReports",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_ProblemReports_MunicipalityId",
                table: "ProblemReports",
                column: "MunicipalityId");

            migrationBuilder.CreateIndex(
                name: "IX_ProblemReports_UniqueTrackingCode",
                table: "ProblemReports",
                column: "TrackingCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BackgroundJobs");

            migrationBuilder.DropTable(
                name: "InnovationGenomes");

            migrationBuilder.DropTable(
                name: "MatchResults");

            migrationBuilder.DropTable(
                name: "Personas");

            migrationBuilder.DropTable(
                name: "Innovations");

            migrationBuilder.DropTable(
                name: "ProblemReports");

            migrationBuilder.DropTable(
                name: "ChallengeAreas");

            migrationBuilder.DropTable(
                name: "Municipalities");

            migrationBuilder.Sql("DROP FUNCTION castor_unaccent(text);");
        }
    }
}
