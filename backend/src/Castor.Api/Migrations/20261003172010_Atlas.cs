using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Castor.Api.Migrations
{
    /// <inheritdoc />
    public partial class Atlas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PlainText",
                table: "Innovations",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlainTextStatus",
                table: "Innovations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlainText",
                table: "ChallengeAreas",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlainTextStatus",
                table: "ChallengeAreas",
                type: "text",
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Innovations_PlainTextHasStatus",
                table: "Innovations",
                sql: "(\"PlainText\" IS NULL) = (\"PlainTextStatus\" IS NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ChallengeAreas_PlainTextHasStatus",
                table: "ChallengeAreas",
                sql: "(\"PlainText\" IS NULL) = (\"PlainTextStatus\" IS NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Innovations_PlainTextHasStatus",
                table: "Innovations");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ChallengeAreas_PlainTextHasStatus",
                table: "ChallengeAreas");

            migrationBuilder.DropColumn(
                name: "PlainText",
                table: "Innovations");

            migrationBuilder.DropColumn(
                name: "PlainTextStatus",
                table: "Innovations");

            migrationBuilder.DropColumn(
                name: "PlainText",
                table: "ChallengeAreas");

            migrationBuilder.DropColumn(
                name: "PlainTextStatus",
                table: "ChallengeAreas");
        }
    }
}
