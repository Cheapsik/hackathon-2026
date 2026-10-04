using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Castor.Api.Migrations
{
    /// <inheritdoc />
    public partial class SimilarReportVerdicts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "JoinedProblemReportId",
                table: "ProblemReports",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DecidedAt",
                table: "MatchResults",
                type: "timestamptz",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Verdict",
                table: "MatchResults",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerdictNote",
                table: "MatchResults",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SimilarReportVerdicts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProblemReportId = table.Column<Guid>(type: "uuid", nullable: false),
                    SimilarProblemReportId = table.Column<Guid>(type: "uuid", nullable: false),
                    Verdict = table.Column<string>(type: "text", nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DecidedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SimilarReportVerdicts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SimilarReportVerdicts_ProblemReports_ProblemReportId",
                        column: x => x.ProblemReportId,
                        principalTable: "ProblemReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SimilarReportVerdicts_ProblemReports_SimilarProblemReportId",
                        column: x => x.SimilarProblemReportId,
                        principalTable: "ProblemReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProblemReports_JoinedProblemReportId",
                table: "ProblemReports",
                column: "JoinedProblemReportId");

            migrationBuilder.CreateIndex(
                name: "IX_SimilarReportVerdicts_OnePerPair",
                table: "SimilarReportVerdicts",
                columns: new[] { "ProblemReportId", "SimilarProblemReportId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SimilarReportVerdicts_SimilarProblemReportId",
                table: "SimilarReportVerdicts",
                column: "SimilarProblemReportId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProblemReports_ProblemReports_JoinedProblemReportId",
                table: "ProblemReports",
                column: "JoinedProblemReportId",
                principalTable: "ProblemReports",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProblemReports_ProblemReports_JoinedProblemReportId",
                table: "ProblemReports");

            migrationBuilder.DropTable(
                name: "SimilarReportVerdicts");

            migrationBuilder.DropIndex(
                name: "IX_ProblemReports_JoinedProblemReportId",
                table: "ProblemReports");

            migrationBuilder.DropColumn(
                name: "JoinedProblemReportId",
                table: "ProblemReports");

            migrationBuilder.DropColumn(
                name: "DecidedAt",
                table: "MatchResults");

            migrationBuilder.DropColumn(
                name: "Verdict",
                table: "MatchResults");

            migrationBuilder.DropColumn(
                name: "VerdictNote",
                table: "MatchResults");
        }
    }
}
