using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rebraco.CMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class ExpandMaintenanceRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LocationDetail",
                schema: "rebraco",
                table: "MaintenanceRequests",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PermissionToEnter",
                schema: "rebraco",
                table: "MaintenanceRequests",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PreferredAvailability",
                schema: "rebraco",
                table: "MaintenanceRequests",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UrgencyNotes",
                schema: "rebraco",
                table: "MaintenanceRequests",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MaintenanceImages",
                schema: "rebraco",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaintenanceRequestId = table.Column<int>(type: "int", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Alt = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaintenanceImages_MaintenanceRequests_MaintenanceRequestId",
                        column: x => x.MaintenanceRequestId,
                        principalSchema: "rebraco",
                        principalTable: "MaintenanceRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MaintenanceNoteImages",
                schema: "rebraco",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaintenanceNoteId = table.Column<int>(type: "int", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Alt = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceNoteImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaintenanceNoteImages_MaintenanceNotes_MaintenanceNoteId",
                        column: x => x.MaintenanceNoteId,
                        principalSchema: "rebraco",
                        principalTable: "MaintenanceNotes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceImages_MaintenanceRequestId_SortOrder",
                schema: "rebraco",
                table: "MaintenanceImages",
                columns: new[] { "MaintenanceRequestId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceNoteImages_MaintenanceNoteId_SortOrder",
                schema: "rebraco",
                table: "MaintenanceNoteImages",
                columns: new[] { "MaintenanceNoteId", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MaintenanceImages",
                schema: "rebraco");

            migrationBuilder.DropTable(
                name: "MaintenanceNoteImages",
                schema: "rebraco");

            migrationBuilder.DropColumn(
                name: "LocationDetail",
                schema: "rebraco",
                table: "MaintenanceRequests");

            migrationBuilder.DropColumn(
                name: "PermissionToEnter",
                schema: "rebraco",
                table: "MaintenanceRequests");

            migrationBuilder.DropColumn(
                name: "PreferredAvailability",
                schema: "rebraco",
                table: "MaintenanceRequests");

            migrationBuilder.DropColumn(
                name: "UrgencyNotes",
                schema: "rebraco",
                table: "MaintenanceRequests");
        }
    }
}
