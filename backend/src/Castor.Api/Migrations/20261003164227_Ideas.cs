using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Castor.Api.Migrations
{
    /// <inheritdoc />
    public partial class Ideas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SourceIdeaId",
                table: "Innovations",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Ideas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ChallengeAreaCodes = table.Column<List<string>>(type: "text[]", nullable: false),
                    ProblemIntensity = table.Column<int>(type: "integer", nullable: true),
                    ProblemFrequency = table.Column<int>(type: "integer", nullable: true),
                    ProblemScale = table.Column<int>(type: "integer", nullable: true),
                    Recipients = table.Column<List<string>>(type: "text[]", nullable: false),
                    OtherRecipients = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Solution = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Stage = table.Column<string>(type: "text", nullable: false),
                    Supporters = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Opponents = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    EmotionalValues = table.Column<List<string>>(type: "text[]", nullable: false),
                    FunctionalValues = table.Column<List<string>>(type: "text[]", nullable: false),
                    DifferenceNote = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    FromHybridOf = table.Column<List<Guid>>(type: "uuid[]", nullable: false),
                    StartingInnovationId = table.Column<Guid>(type: "uuid", nullable: true),
                    SimilarCheckedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    SimilarFingerprint = table.Column<string>(type: "character(64)", fixedLength: true, maxLength: 64, nullable: true),
                    SubmittedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    DecidedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    Similar = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ideas", x => x.Id);
                    table.CheckConstraint("CK_Ideas_AtMostThreeChallengeAreas", "cardinality(\"ChallengeAreaCodes\") <= 3");
                    table.CheckConstraint("CK_Ideas_DecidedHasDate", "\"Status\" NOT IN ('ACCEPTED', 'REJECTED') OR \"DecidedAt\" IS NOT NULL");
                    table.CheckConstraint("CK_Ideas_ProblemScales", "(\"ProblemIntensity\" IS NULL OR \"ProblemIntensity\" BETWEEN 1 AND 4) AND (\"ProblemFrequency\" IS NULL OR \"ProblemFrequency\" BETWEEN 1 AND 4) AND (\"ProblemScale\" IS NULL OR \"ProblemScale\" BETWEEN 1 AND 4)");
                    table.CheckConstraint("CK_Ideas_SubmittedHasDate", "\"Status\" = 'DRAFT' OR \"SubmittedAt\" IS NOT NULL");
                    table.ForeignKey(
                        name: "FK_Ideas_Innovations_StartingInnovationId",
                        column: x => x.StartingInnovationId,
                        principalTable: "Innovations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Ideas_Users_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GrantApplications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IdeaId = table.Column<Guid>(type: "uuid", nullable: false),
                    GrantCallId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Summary = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    Answers = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GrantApplications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GrantApplications_GrantCalls_GrantCallId",
                        column: x => x.GrantCallId,
                        principalTable: "GrantCalls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GrantApplications_Ideas_IdeaId",
                        column: x => x.IdeaId,
                        principalTable: "Ideas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GrantApplications_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "IdeaAssistantMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IdeaId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    Text = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IdeaAssistantMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IdeaAssistantMessages_Ideas_IdeaId",
                        column: x => x.IdeaId,
                        principalTable: "Ideas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_IdeaAssistantMessages_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "IdeaCoAuthors",
                columns: table => new
                {
                    IdeaId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    JoinedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IdeaCoAuthors", x => new { x.IdeaId, x.UserId });
                    table.ForeignKey(
                        name: "FK_IdeaCoAuthors_Ideas_IdeaId",
                        column: x => x.IdeaId,
                        principalTable: "Ideas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_IdeaCoAuthors_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "IdeaReviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IdeaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExpertId = table.Column<Guid>(type: "uuid", nullable: false),
                    Recommendation = table.Column<string>(type: "text", nullable: false),
                    Comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IdeaReviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IdeaReviews_Ideas_IdeaId",
                        column: x => x.IdeaId,
                        principalTable: "Ideas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_IdeaReviews_Users_ExpertId",
                        column: x => x.ExpertId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Innovations_OnePerSourceIdea",
                table: "Innovations",
                column: "SourceIdeaId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GrantApplications_CreatedByUserId",
                table: "GrantApplications",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GrantApplications_GrantCallId",
                table: "GrantApplications",
                column: "GrantCallId");

            migrationBuilder.CreateIndex(
                name: "IX_GrantApplications_OnePerIdeaAndCall",
                table: "GrantApplications",
                columns: new[] { "IdeaId", "GrantCallId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_IdeaAssistantMessages_IdeaId_UserId_CreatedAt",
                table: "IdeaAssistantMessages",
                columns: new[] { "IdeaId", "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_IdeaAssistantMessages_UserId",
                table: "IdeaAssistantMessages",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_IdeaCoAuthors_UserId",
                table: "IdeaCoAuthors",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_IdeaReviews_ExpertId",
                table: "IdeaReviews",
                column: "ExpertId");

            migrationBuilder.CreateIndex(
                name: "IX_IdeaReviews_OnePerIdeaAndExpert",
                table: "IdeaReviews",
                columns: new[] { "IdeaId", "ExpertId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ideas_AuthorId",
                table: "Ideas",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_Ideas_StartingInnovationId",
                table: "Ideas",
                column: "StartingInnovationId");

            migrationBuilder.CreateIndex(
                name: "IX_Ideas_Status_SubmittedAt",
                table: "Ideas",
                columns: new[] { "Status", "SubmittedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_Innovations_Ideas_SourceIdeaId",
                table: "Innovations",
                column: "SourceIdeaId",
                principalTable: "Ideas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Innovations_Ideas_SourceIdeaId",
                table: "Innovations");

            migrationBuilder.DropTable(
                name: "GrantApplications");

            migrationBuilder.DropTable(
                name: "IdeaAssistantMessages");

            migrationBuilder.DropTable(
                name: "IdeaCoAuthors");

            migrationBuilder.DropTable(
                name: "IdeaReviews");

            migrationBuilder.DropTable(
                name: "Ideas");

            migrationBuilder.DropIndex(
                name: "IX_Innovations_OnePerSourceIdea",
                table: "Innovations");

            migrationBuilder.DropColumn(
                name: "SourceIdeaId",
                table: "Innovations");
        }
    }
}
